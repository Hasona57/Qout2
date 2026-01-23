import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { User } from '../../users/entities/user.entity';
import { ReturnItem } from './return-item.entity';
import { Order } from '../../ecommerce/entities/order.entity';

@Entity('returns')
export class Return {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  returnNumber: string; // e.g., 'RET-2024-001'

  @Column({ type: 'uuid', nullable: true })
  invoiceId: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.returns, { nullable: true })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ type: 'uuid', nullable: true })
  orderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order: Order;


  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'varchar', length: 50 })
  reason: string; // defect, wrong_item, customer_request, etc.

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, approved, refunded, rejected

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  refundMethod: string; // vodafone_cash, instapay, cash_pos, cod

  @OneToMany(() => ReturnItem, (item) => item.return, { cascade: true })
  items: ReturnItem[];

  @CreateDateColumn()
  createdAt: Date;
}


