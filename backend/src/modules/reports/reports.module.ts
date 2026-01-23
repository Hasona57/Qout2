import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Invoice } from '../sales/entities/invoice.entity';
import { Order } from '../ecommerce/entities/order.entity';
import { CommissionRecord } from '../sales/entities/commission-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Order, CommissionRecord])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}






