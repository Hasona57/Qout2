import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { Size } from './entities/size.entity';
import { Color } from './entities/color.entity';
import { Category } from './entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantsRepository: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private imagesRepository: Repository<ProductImage>,
    @InjectRepository(Size)
    private sizesRepository: Repository<Size>,
    @InjectRepository(Color)
    private colorsRepository: Repository<Color>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    private dataSource: DataSource,
  ) { }

  // Products
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create({
      ...createProductDto,
    });
    if (createProductDto.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: { id: createProductDto.categoryId },
      });
      if (category) {
        product.category = category;
      }
    }
    const savedProduct = await this.productsRepository.save(product);

    // Handle images if provided
    if ((createProductDto as any).images && Array.isArray((createProductDto as any).images)) {
      const images = (createProductDto as any).images.map((img: any, index: number) => {
        return this.imagesRepository.create({
          productId: savedProduct.id,
          url: typeof img === 'string' ? img : img.url,
          altTextAr: typeof img === 'object' ? img.altTextAr : undefined,
          altTextEn: typeof img === 'object' ? img.altTextEn : undefined,
          sortOrder: index,
          isPrimary: index === 0,
        });
      });
      await this.imagesRepository.save(images);
    }

    return this.findOne(savedProduct.id);
  }

  async findAll(filters?: {
    categoryId?: string;
    isActive?: boolean;
    search?: string;
    locationId?: string;
  }): Promise<Product[]> {
    const query = this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.size', 'size')
      .leftJoinAndSelect('variants.color', 'color')
      .leftJoinAndSelect('product.images', 'images')
      .orderBy('product.createdAt', 'DESC');

    if (filters?.categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('product.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters?.search) {
      query.andWhere(
        '(product.nameAr ILIKE :search OR product.nameEn ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const products = await query.getMany();

    // If locationId provided, populate available stock for each variant
    if (filters?.locationId) {
      // Allow fetching stock for all variants of these products
      const variantIds = products.flatMap(p => p.variants.map(v => v.id));

      if (variantIds.length > 0) {
        // We need to inject DataSource or use raw query, or use Repository if injected
        // Using raw query for simplicity since StockItem repository is not injected here yet
        // Ideally we should inject StockItemRepository, but let's use dataSource
        const stocks = await this.dataSource.query(
          `SELECT "variantId", "quantity" FROM stock_items WHERE "locationId" = $1 AND "variantId" = ANY($2)`,
          [filters.locationId, variantIds]
        );

        const stockMap = new Map(stocks.map((s: any) => [s.variantId, s.quantity]));

        products.forEach(product => {
          product.variants.forEach((variant: any) => {
            variant.stockQuantity = stockMap.get(variant.id) || 0;
          });
        });
      }
    }

    return products;
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'variants', 'variants.size', 'variants.color', 'images'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.productsRepository.findOne({
      where: { sku },
      relations: ['variants', 'variants.size', 'variants.color', 'images'],
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Handle images if provided
    if ((updateProductDto as any).images && Array.isArray((updateProductDto as any).images)) {
      // Delete existing images
      await this.imagesRepository.delete({ productId: id });

      // Create new images
      console.log('Creating images for product:', id); // Debug log
      const imageObjects = (updateProductDto as any).images.map((img: any, index: number) => ({
        productId: id,
        url: typeof img === 'string' ? img : img.url,
        altTextAr: typeof img === 'object' ? img.altTextAr : undefined,
        altTextEn: typeof img === 'object' ? img.altTextEn : undefined,
        sortOrder: index,
        isPrimary: index === 0,
      }));
      console.log('Image objects to insert:', JSON.stringify(imageObjects));
      await this.imagesRepository.insert(imageObjects);

      // Remove images from updateDto to avoid issues
      delete (updateProductDto as any).images;
    }

    // Check if prices are being updated
    const oldCostPrice = product.costPrice;
    const oldRetailPrice = product.retailPrice;
    const newCostPrice = (updateProductDto as any).costPrice;
    const newRetailPrice = (updateProductDto as any).retailPrice;

    // Updated product fields
    const { images, ...productData } = updateProductDto as any;

    try {
      // Use update() to avoid cascade issues completely
      await this.productsRepository.update(id, productData);

      // If prices changed, update variants that use product prices (NULL or matching old prices)
      if (newCostPrice !== undefined || newRetailPrice !== undefined) {
        const { ProductVariant } = await import('./entities/product-variant.entity');
        const variantRepo = this.dataSource.getRepository(ProductVariant);
        
        // Get all variants for this product
        const variants = await variantRepo.find({ where: { productId: id } });

        for (const variant of variants) {
          let needsUpdate = false;
          const updateData: any = {};

          // Update costPrice if variant's costPrice is NULL or matches old product costPrice
          if (newCostPrice !== undefined && 
              (variant.costPrice === null || variant.costPrice === oldCostPrice)) {
            updateData.costPrice = newCostPrice;
            needsUpdate = true;
          }

          // Update retailPrice if variant's retailPrice is NULL or matches old product retailPrice
          if (newRetailPrice !== undefined && 
              (variant.retailPrice === null || variant.retailPrice === oldRetailPrice)) {
            updateData.retailPrice = newRetailPrice;
            needsUpdate = true;
          }

          if (needsUpdate) {
            await variantRepo.update(variant.id, updateData);
          }
        }
      }

      return await this.findOne(id);
    } catch (error) {
      console.error('Error updating product:', error);
      throw new BadRequestException(`Update failed: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    // Ensure product exists
    await this.findOne(id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Raw SQL deletions to satisfy FK constraints (PostgreSQL syntax)
      // Executed within transaction scope

      // 1. Delete Return Items first (referencing invoice_items)
      await queryRunner.query(
        `DELETE FROM return_items WHERE "returnId" IN (
             SELECT id FROM returns WHERE "invoiceId" IN (
                SELECT "invoiceId" FROM invoice_items WHERE "variantId" IN (
                    SELECT id FROM product_variants WHERE "productId" = $1
                )
             )
           )`,
        [id]
      );

      // 2. Delete Invoice Items
      await queryRunner.query(
        `DELETE FROM invoice_items WHERE "variantId" IN (SELECT id FROM product_variants WHERE "productId" = $1)`,
        [id],
      );

      // 3. Delete Stock Items
      await queryRunner.query(
        `DELETE FROM stock_items WHERE "variantId" IN (SELECT id FROM product_variants WHERE "productId" = $1)`,
        [id],
      );

      // 4. Delete Order Items (New Step for FK fix)
      await queryRunner.query(
        `DELETE FROM order_items WHERE "variantId" IN (SELECT id FROM product_variants WHERE "productId" = $1)`,
        [id]
      );

      // 5. Delete Cart Items
      await queryRunner.query(
        `DELETE FROM cart_items WHERE "variantId" IN (SELECT id FROM product_variants WHERE "productId" = $1)`,
        [id]
      );

      // 6. Delete variants explicitly
      await queryRunner.query(`DELETE FROM product_variants WHERE "productId" = $1`, [id]);

      // 7. Delete images linked to product
      await queryRunner.query(`DELETE FROM product_images WHERE "productId" = $1`, [id]);

      // 8. Finally delete the product itself
      await queryRunner.query(`DELETE FROM products WHERE id = $1`, [id]);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error deleting product:', error);
      throw new BadRequestException(`Delete failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // Variants
  async createVariant(productId: string, createVariantDto: CreateProductVariantDto): Promise<ProductVariant> {
    const product = await this.findOne(productId);
    const size = await this.sizesRepository.findOne({ where: { id: createVariantDto.sizeId } });
    const color = await this.colorsRepository.findOne({ where: { id: createVariantDto.colorId } });

    if (!size || !color) {
      throw new NotFoundException('Size or Color not found');
    }

    const variant = this.variantsRepository.create({
      productId: product.id,
      sizeId: size.id,
      colorId: color.id,
      sku: createVariantDto.sku,
      weight: createVariantDto.weight,
      costPrice: createVariantDto.costPrice || product.costPrice,
      retailPrice: createVariantDto.retailPrice || product.retailPrice,
      barcode: createVariantDto.barcode || Math.floor(Math.random() * 1000000000000).toString().padStart(13, '0'),
      isActive: createVariantDto.isActive ?? true,
    });

    return this.variantsRepository.save(variant);
  }

  async findVariantBySku(sku: string): Promise<ProductVariant | null> {
    return this.variantsRepository.findOne({
      where: { sku },
      relations: ['product', 'size', 'color'],
    });
  }

  async findVariantByBarcode(barcode: string): Promise<ProductVariant | null> {
    return this.variantsRepository.findOne({
      where: { barcode },
      relations: ['product', 'size', 'color'],
    });
  }

  async deleteAllProducts(): Promise<void> {
    // Delete related data first to avoid FK constraints
    await this.dataSource.query(`DELETE FROM cart_items WHERE "variantId" IN (SELECT id FROM product_variants)`);
    await this.dataSource.query(`DELETE FROM invoice_items WHERE "variantId" IN (SELECT id FROM product_variants)`);
    await this.dataSource.query(`DELETE FROM stock_items WHERE "variantId" IN (SELECT id FROM product_variants)`);

    // Delete variants (images will cascade)
    await this.dataSource.query(`DELETE FROM product_variants`);

    // Delete product images
    await this.dataSource.query(`DELETE FROM product_images`);

    // Finally delete all products
    await this.dataSource.query(`DELETE FROM products`);
  }

  async deleteVariant(id: string): Promise<void> {
    const variant = await this.variantsRepository.findOne({
      where: { id },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    await this.variantsRepository.remove(variant);
  }

  // Sizes, Colors, Materials, Categories
  async findAllSizes(): Promise<Size[]> {
    return this.sizesRepository.find({ where: { isActive: true }, order: { sortOrder: 'ASC' } });
  }

  async findAllColors(): Promise<Color[]> {
    return this.colorsRepository.find({ where: { isActive: true }, order: { sortOrder: 'ASC' } });
  }

  async findAllCategories(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
      relations: ['children'],
    });
  }
}

