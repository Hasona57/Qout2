import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ type: 'uuid' })
  variantId: string;

  @ManyToOne(() => ProductVariant, { eager: true })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: string; // Selling price per unit

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costPrice: string; // Cost price per unit (for commission calculation)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: string; // (unitPrice * quantity) - discountAmount

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  profitMargin: string; // (unitPrice - costPrice) * quantity
}









