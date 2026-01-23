import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockLocation } from './entities/stock-location.entity';
import { StockItem } from './entities/stock-item.entity';
import { StockTransfer } from './entities/stock-transfer.entity';
import { StockAdjustment } from './entities/stock-adjustment.entity';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { DecimalUtil } from '../../common/utils/decimal.util';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockLocation)
    private locationsRepository: Repository<StockLocation>,
    @InjectRepository(StockItem)
    private stockItemsRepository: Repository<StockItem>,
    @InjectRepository(StockTransfer)
    private transfersRepository: Repository<StockTransfer>,
    @InjectRepository(StockAdjustment)
    private adjustmentsRepository: Repository<StockAdjustment>,
    private dataSource: DataSource,
  ) { }

  private getRepo<T>(repo: Repository<T>, manager?: any): Repository<T> {
    return manager ? manager.getRepository(repo.target) : repo;
  }

  // Locations
  async createLocation(name: string, address?: string): Promise<StockLocation> {
    const location = this.locationsRepository.create({ name, address });
    return this.locationsRepository.save(location);
  }

  async findAllLocations(): Promise<StockLocation[]> {
    return this.locationsRepository.find({ where: { isActive: true } });
  }

  // Stock Items
  async getAllStock(locationId?: string): Promise<StockItem[]> {
    const query = this.stockItemsRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('variant.size', 'size')
      .leftJoinAndSelect('variant.color', 'color')
      .leftJoinAndSelect('stock.location', 'location');

    if (locationId) {
      query.andWhere('stock.locationId = :locationId', { locationId });
    }

    return query.getMany();
  }

  async getStock(variantId: string, locationId?: string): Promise<StockItem[]> {
    const query = this.stockItemsRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.variant', 'variant')
      .leftJoinAndSelect('stock.location', 'location')
      .where('stock.variantId = :variantId', { variantId });

    if (locationId) {
      query.andWhere('stock.locationId = :locationId', { locationId });
    }

    return query.getMany();
  }

  async getAvailableQuantity(variantId: string, locationId: string): Promise<number> {
    const stock = await this.stockItemsRepository.findOne({
      where: { variantId, locationId },
    });
    return stock ? stock.quantity - stock.reservedQuantity : 0;
  }

  async reserveStock(variantId: string, locationId: string, quantity: number, manager?: any): Promise<void> {
    const repo = this.getRepo(this.stockItemsRepository, manager);
    const stock = await repo.findOne({
      where: { variantId, locationId },
    });

    if (!stock) {
      throw new NotFoundException('Stock item not found');
    }

    const available = stock.quantity - stock.reservedQuantity;
    if (available < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    stock.reservedQuantity += quantity;
    await repo.save(stock);
  }

  async releaseStock(variantId: string, locationId: string, quantity: number, manager?: any): Promise<void> {
    const repo = this.getRepo(this.stockItemsRepository, manager);
    const stock = await repo.findOne({
      where: { variantId, locationId },
    });

    if (!stock) {
      throw new NotFoundException('Stock item not found');
    }

    stock.reservedQuantity = Math.max(0, stock.reservedQuantity - quantity);
    await repo.save(stock);
  }

  async deductStock(variantId: string, locationId: string, quantity: number, manager?: any): Promise<void> {
    const repo = this.getRepo(this.stockItemsRepository, manager);

    // Usage of query builder with transaction manager requires careful handling.
    // simpler to use repo.increment/decrement if simple, but we have check logic.
    // If manager is provided, we must use it.

    if (manager) {
      // Transactional context: Use pessimistic write lock to ensure safety since we can't easily use atomic update with custom manager builder in one shot standardly without queryrunner context passed fully.
      // Actually, manager.createQueryBuilder() works.
      const result = await manager.createQueryBuilder()
        .update(StockItem)
        .set({
          quantity: () => `quantity - ${quantity}`,
          reservedQuantity: () => `GREATEST(0, "reservedQuantity" - ${quantity})`,
        })
        .where('"variantId" = :variantId AND "locationId" = :locationId AND quantity >= :quantity', {
          variantId,
          locationId,
          quantity,
        })
        .execute();

      if (result.affected === 0) {
        const stock = await repo.findOne({ where: { variantId, locationId } });
        if (!stock) throw new NotFoundException('Stock item not found');
        if (stock.quantity < quantity) throw new BadRequestException(`Insufficient stock. Available: ${stock.quantity}, Required: ${quantity}`);
      }
    } else {
      // Non-transactional (legacy/direct call)
      const result = await this.stockItemsRepository
        .createQueryBuilder()
        .update(StockItem)
        .set({
          quantity: () => `quantity - ${quantity}`,
          reservedQuantity: () => `GREATEST(0, "reservedQuantity" - ${quantity})`,
        })
        .where('"variantId" = :variantId AND "locationId" = :locationId AND quantity >= :quantity', {
          variantId,
          locationId,
          quantity,
        })
        .execute();

      if (result.affected === 0) {
        const stock = await this.stockItemsRepository.findOne({ where: { variantId, locationId } });
        if (!stock) throw new NotFoundException('Stock item not found');
        if (stock.quantity < quantity) throw new BadRequestException(`Insufficient stock. Available: ${stock.quantity}, Required: ${quantity}`);
      }
    }
  }

  async addStock(variantId: string, locationId: string, quantity: number, manager?: any): Promise<void> {
    const repo = this.getRepo(this.stockItemsRepository, manager);

    // Try to update existing first (Atomic Increment)
    let result;
    if (manager) {
      result = await manager.createQueryBuilder()
        .update(StockItem)
        .set({ quantity: () => `quantity + ${quantity}` })
        .where('"variantId" = :variantId AND "locationId" = :locationId', { variantId, locationId })
        .execute();
    } else {
      result = await this.stockItemsRepository.createQueryBuilder()
        .update(StockItem)
        .set({ quantity: () => `quantity + ${quantity}` })
        .where('"variantId" = :variantId AND "locationId" = :locationId', { variantId, locationId })
        .execute();
    }

    if (result.affected === 0) {
      // If no row updated, it might not exist. Need to check and insert via save logic which handles creation.
      const stock = await repo.findOne({
        where: { variantId, locationId },
      });

      if (stock) {
        // It appeared between update check? Retry update?
        // Just save properly.
        stock.quantity += quantity;
        await repo.save(stock);
      } else {
        const newStock = repo.create({
          variantId,
          locationId,
          quantity: quantity,
          reservedQuantity: 0,
          minStockLevel: 0,
        });
        try {
          await repo.save(newStock);
        } catch (e) {
          // Concurrent insert?
          if (e.code === '23505') { // Unique violation
            // Retry addition
            await this.addStock(variantId, locationId, quantity, manager); // Recursive retry once
          } else {
            throw e;
          }
        }
      }
    }
  }

  async assignStockToVariant(
    variantId: string,
    locationId: string,
    quantity: number,
    minStockLevel?: number,
  ): Promise<StockItem> {
    let stock = await this.stockItemsRepository.findOne({
      where: { variantId, locationId },
      relations: ['variant', 'variant.product', 'variant.size', 'variant.color', 'location'],
    });

    if (!stock) {
      stock = this.stockItemsRepository.create({
        variantId,
        locationId,
        quantity: 0,
        reservedQuantity: 0,
        minStockLevel: minStockLevel || 0,
      });
    }

    stock.quantity += quantity;
    if (minStockLevel !== undefined) {
      stock.minStockLevel = minStockLevel;
    }

    return this.stockItemsRepository.save(stock);
  }

  // Transfers
  async createTransfer(createTransferDto: CreateStockTransferDto, userId: string): Promise<StockTransfer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transferNumber = await this.generateTransferNumber();
      const transfer = this.transfersRepository.create({
        ...createTransferDto,
        transferNumber,
        createdById: userId,
        status: 'pending',
      });

      const savedTransfer = await queryRunner.manager.save(transfer);

      // Create transfer items
      for (const item of createTransferDto.items) {
        // Check available stock
        const available = await this.getAvailableQuantity(item.variantId, createTransferDto.fromLocationId);
        if (available < item.quantity) {
          throw new BadRequestException(`Insufficient stock for variant ${item.variantId}`);
        }

        // Reserve stock
        await this.reserveStock(item.variantId, createTransferDto.fromLocationId, item.quantity);
      }

      await queryRunner.commitTransaction();
      return savedTransfer;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async completeTransfer(transferId: string): Promise<StockTransfer> {
    const transfer = await this.transfersRepository.findOne({
      where: { id: transferId },
      relations: ['items', 'items.variant'],
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (transfer.status !== 'pending' && transfer.status !== 'in_transit') {
      throw new BadRequestException('Transfer cannot be completed');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of transfer.items) {
        // Deduct from source
        await this.deductStock(item.variantId, transfer.fromLocationId, item.quantity);
        // Add to destination
        await this.addStock(item.variantId, transfer.toLocationId, item.quantity);
      }

      transfer.status = 'completed';
      transfer.completedAt = new Date();
      await queryRunner.manager.save(transfer);

      await queryRunner.commitTransaction();
      return transfer;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Adjustments
  async createAdjustment(createAdjustmentDto: CreateStockAdjustmentDto, userId: string): Promise<StockAdjustment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const adjustmentNumber = await this.generateAdjustmentNumber();
      const adjustment = this.adjustmentsRepository.create({
        ...createAdjustmentDto,
        adjustmentNumber,
        createdById: userId,
      });

      const savedAdjustment = await queryRunner.manager.save(adjustment);

      // Apply adjustments
      for (const item of createAdjustmentDto.items) {
        const stock = await this.stockItemsRepository.findOne({
          where: {
            variantId: item.variantId,
            locationId: createAdjustmentDto.locationId,
          },
        });

        const previousQuantity = stock ? stock.quantity : 0;
        const newQuantity = previousQuantity + item.quantityChange;

        if (newQuantity < 0) {
          throw new BadRequestException('Adjustment would result in negative stock');
        }

        if (stock) {
          stock.quantity = newQuantity;
          await queryRunner.manager.save(stock);
        } else {
          const newStock = this.stockItemsRepository.create({
            variantId: item.variantId,
            locationId: createAdjustmentDto.locationId,
            quantity: newQuantity,
            reservedQuantity: 0,
          });
          await queryRunner.manager.save(newStock);
        }
      }

      await queryRunner.commitTransaction();
      return savedAdjustment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async generateTransferNumber(): Promise<string> {
    const count = await this.transfersRepository.count();
    return `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
  }

  private async generateAdjustmentNumber(): Promise<string> {
    const count = await this.adjustmentsRepository.count();
    return `ADJ-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
  }
}

