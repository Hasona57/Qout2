import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { StockLocation } from './entities/stock-location.entity';
import { StockItem } from './entities/stock-item.entity';
import { StockTransfer } from './entities/stock-transfer.entity';
import { StockTransferItem } from './entities/stock-transfer-item.entity';
import { StockAdjustment } from './entities/stock-adjustment.entity';
import { StockAdjustmentItem } from './entities/stock-adjustment-item.entity';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockLocation,
      StockItem,
      StockTransfer,
      StockTransferItem,
      StockAdjustment,
      StockAdjustmentItem,
    ]),
    ProductsModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}










