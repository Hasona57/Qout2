import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../ecommerce/entities/order.entity';
import { CourierCompany } from './courier-company.entity';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  trackingNumber: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.shipments)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid', nullable: true })
  courierId: string;

  @ManyToOne(() => CourierCompany, { nullable: true })
  @JoinColumn({ name: 'courierId' })
  courier: CourierCompany;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, picked_up, in_transit, delivered, returned

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;
}







