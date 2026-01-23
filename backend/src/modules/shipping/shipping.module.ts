import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { DeliveryZone } from './entities/delivery-zone.entity';
import { ShippingRate } from './entities/shipping-rate.entity';
import { CourierCompany } from './entities/courier-company.entity';
import { Shipment } from './entities/shipment.entity';
import { Address } from '../users/entities/address.entity';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';

import { ProductVariant } from '../products/entities/product-variant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliveryZone, ShippingRate, CourierCompany, Shipment, Address, ProductVariant]),
    ProductsModule,
    UsersModule,
  ],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule { }

