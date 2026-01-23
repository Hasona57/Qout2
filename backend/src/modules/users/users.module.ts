import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Address } from './entities/address.entity';
import { Invoice } from '../sales/entities/invoice.entity';
import { Order } from '../ecommerce/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission, Address, Invoice, Order])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}


