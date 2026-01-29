import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockTransfer } from './stock-transfer.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('stock_transfer_items')
export class StockTransferItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  transferId: string;

  @ManyToOne(() => StockTransfer, (transfer) => transfer.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transferId' })
  transfer: StockTransfer;

  @Column({ type: 'uuid' })
  variantId: string;

  @ManyToOne(() => ProductVariant, { eager: true })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column({ type: 'integer' })
  quantity: number;
}










