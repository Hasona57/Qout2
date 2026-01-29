import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { PaymentMethod } from './payment-method.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  invoiceId: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ type: 'uuid', nullable: true })
  paymentMethodId: string;

  @ManyToOne(() => PaymentMethod, { eager: true })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod: PaymentMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId: string; // External transaction ID

  @Column({ type: 'varchar', length: 50, default: 'completed' })
  status: string; // pending, completed, failed, refunded

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}










