import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { Shipment } from '../../shipping/entities/shipment.entity';
import { Address } from '../../users/entities/address.entity';

@Entity('orders')
@Index(['orderNumber'], { unique: true })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  orderNumber: string; // e.g., 'ORD-2024-001'

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  deliveryAddressId: string;

  @ManyToOne(() => Address, { eager: true })
  @JoinColumn({ name: 'deliveryAddressId' })
  deliveryAddress: Address;

  @Column({ type: 'varchar', length: 20, default: 'retail' })
  orderType: string; // retail

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, confirmed, processing, shipped, delivered, cancelled

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingFee: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  paymentStatus: string; // pending, paid, failed, refunded

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string; // online, cod

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentTransactionId: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => Shipment, (shipment) => shipment.order)
  shipments: Shipment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}







