import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockAdjustment } from './stock-adjustment.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('stock_adjustment_items')
export class StockAdjustmentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  adjustmentId: string;

  @ManyToOne(() => StockAdjustment, (adjustment) => adjustment.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adjustmentId' })
  adjustment: StockAdjustment;

  @Column({ type: 'uuid' })
  variantId: string;

  @ManyToOne(() => ProductVariant, { eager: true })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column({ type: 'integer' })
  quantityChange: number; // Positive for increase, negative for decrease

  @Column({ type: 'integer' })
  previousQuantity: number;

  @Column({ type: 'integer' })
  newQuantity: number;
}








