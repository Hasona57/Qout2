import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DeliveryZone } from './delivery-zone.entity';
import { CourierCompany } from './courier-company.entity';

@Entity('shipping_rates')
export class ShippingRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  zoneId: string;

  @ManyToOne(() => DeliveryZone, (zone) => zone.rates)
  @JoinColumn({ name: 'zoneId' })
  zone: DeliveryZone;

  @Column({ type: 'uuid', nullable: true })
  courierId: string;

  @ManyToOne(() => CourierCompany, { nullable: true })
  @JoinColumn({ name: 'courierId' })
  courier: CourierCompany;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: string; // Base shipping price

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  perKgPrice: string; // Price per kg

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}















