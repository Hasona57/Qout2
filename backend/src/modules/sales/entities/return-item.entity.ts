import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Return } from './return.entity';
import { InvoiceItem } from './invoice-item.entity';

@Entity('return_items')
export class ReturnItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  returnId: string;

  @ManyToOne(() => Return, (return_) => return_.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'returnId' })
  return: Return;

  @Column({ type: 'uuid', nullable: true })
  invoiceItemId: string;

  @ManyToOne(() => InvoiceItem, { eager: true, nullable: true })
  @JoinColumn({ name: 'invoiceItemId' })
  invoiceItem: InvoiceItem;

  @Column({ type: 'uuid', nullable: true })
  orderItemId: string;

  @ManyToOne('OrderItem', { eager: true, nullable: true })
  @JoinColumn({ name: 'orderItemId' })
  orderItem: any;

  @Column({ type: 'integer' })
  quantity: number; // Quantity to return

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  refundAmount: string; // Amount to refund for this item
}















