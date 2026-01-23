import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Expense } from './entities/expense.entity';
import { User } from '../users/entities/user.entity';
import { Payment } from '../sales/entities/payment.entity';
import { PaymentMethod } from '../sales/entities/payment-method.entity';
import { Order } from '../ecommerce/entities/order.entity';
import { Invoice } from '../sales/entities/invoice.entity';
import { Return } from '../sales/entities/return.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Expense, User, Payment, PaymentMethod, Order, Invoice, Return])],
    controllers: [FinanceController],
    providers: [FinanceService],
    exports: [FinanceService],
})
export class FinanceModule { }
