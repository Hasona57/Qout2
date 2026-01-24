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
import { InvoiceItem } from './invoice-item.entity';
import { Payment } from './payment.entity';
import { Return } from './return.entity';

@Entity('invoices')
@Index(['invoiceNumber'], { unique: true })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  invoiceNumber: string; // e.g., 'INV-2024-001'

  @Column({ type: 'uuid', nullable: true })
  customerId: string; // Customer account (if exists)

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column({ type: 'uuid' })
  createdById: string; // Sales employee

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string; // draft, pending, paid, partially_paid, cancelled

  @Column({ type: 'varchar', length: 20, default: 'retail' })
  saleType: string; // retail

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  commissionAmount: string; // Total commission for this invoice

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  locationId: string;

  @ManyToOne('StockLocation')
  @JoinColumn({ name: 'locationId' })
  location: any;


  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];

  @OneToMany(() => Return, (return_) => return_.invoice)
  returns: Return[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}








