import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from '@/modules/dashboard/dashboard.controller';
import { DashboardService } from '@/modules/dashboard/dashboard.service';
import { Invoice } from '../sales/entities/invoice.entity';
import { Order } from '../ecommerce/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Payment } from '../sales/entities/payment.entity';
import { Return } from '../sales/entities/return.entity';
import { Expense } from '../finance/entities/expense.entity';
import { PaymentMethod } from '../sales/entities/payment-method.entity';
import { StockItem } from '../inventory/entities/stock-item.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Invoice, Order, Product, ProductVariant, Payment, Return, Expense, PaymentMethod, StockItem
        ])
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
