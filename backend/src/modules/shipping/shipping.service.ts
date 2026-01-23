import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryZone } from './entities/delivery-zone.entity';
import { ShippingRate } from './entities/shipping-rate.entity';
import { Shipment } from './entities/shipment.entity';
import { ProductVariant } from '../../modules/products/entities/product-variant.entity';
import { Address } from '../../modules/users/entities/address.entity';
import { DecimalUtil } from '../../common/utils/decimal.util';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(DeliveryZone)
    private zonesRepository: Repository<DeliveryZone>,
    @InjectRepository(ShippingRate)
    private ratesRepository: Repository<ShippingRate>,
    @InjectRepository(Shipment)
    private shipmentsRepository: Repository<Shipment>,
    @InjectRepository(Address)
    private addressesRepository: Repository<Address>,
    @InjectRepository(ProductVariant)
    private variantsRepository: Repository<ProductVariant>,
  ) { }

  async calculateShippingFee(addressId: string, cartItems: any[]): Promise<import('decimal.js').Decimal> {
    const address = await this.addressesRepository.findOne({ where: { id: addressId } });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Find zone
    let zone = await this.zonesRepository.findOne({
      where: {
        governorate: address.governorate,
        city: address.city || null,
        isActive: true,
      },
    });

    if (!zone) {
      // Try to find zone by governorate only
      zone = await this.zonesRepository.findOne({
        where: {
          governorate: address.governorate,
          city: null,
          isActive: true,
        },
      });
    }

    // Get shipping rate if zone exists
    let rate = null;
    if (zone) {
      rate = await this.ratesRepository.findOne({
        where: { zoneId: zone.id, isActive: true },
      });
    }

    // Check for hardcoded fallback rates if no DB config found
    let basePrice = DecimalUtil.from(50); // Standardized to 50 EGP as per user request
    let perKgPrice = DecimalUtil.from(0);

    if (rate) {
      basePrice = rate.basePrice;
      if (rate.perKgPrice) perKgPrice = rate.perKgPrice;
    }

    /* Legacy logic - preserved but disabled for standardization
    if (rate) {
      basePrice = rate.basePrice;
      perKgPrice = rate.perKgPrice;
    } else {
      // Fallback logic based on governorate (approximate zones)
      const gov = address.governorate?.toLowerCase() || '';

      if (['cairo', 'giza', 'alexandria', 'القاهرة', 'الجيزة', 'الإسكندرية'].some(g => gov.includes(g))) {
        basePrice = DecimalUtil.from(50);
      } else if (['sinai', 'red sea', 'matrouh', 'aswan', 'luxor', 'سيناء', 'البحر الأحمر', 'مطروح', 'أسوان', 'الأقصر'].some(g => gov.includes(g))) {
        basePrice = DecimalUtil.from(100); // Remote areas
      } else {
        basePrice = DecimalUtil.from(75); // Delta and Upper Egypt
      }
    }
    */

    // Calculate shipping fee: Flat Rate Only (Weight logic removed as requested)
    const shippingFee = basePrice;

    return DecimalUtil.roundMoney(shippingFee);
  }

  async createShipment(orderId: string, courierId?: string): Promise<Shipment> {
    const trackingNumber = await this.generateTrackingNumber();
    const shipment = this.shipmentsRepository.create({
      trackingNumber,
      orderId,
      courierId,
      status: 'pending',
    });

    return this.shipmentsRepository.save(shipment);
  }

  private async generateTrackingNumber(): Promise<string> {
    const count = await this.shipmentsRepository.count();
    return `TRK${new Date().getFullYear()}${String(count + 1).padStart(8, '0')}`;
  }
}

