import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ShippingRate } from './shipping-rate.entity';

@Entity('delivery_zones')
export class DeliveryZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  governorate: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string; // null means all cities in governorate

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ShippingRate, (rate) => rate.zone)
  rates: ShippingRate[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}














