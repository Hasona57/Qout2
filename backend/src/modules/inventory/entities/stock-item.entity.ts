import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { StockLocation } from './stock-location.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('stock_items')
@Index(['locationId', 'variantId'], { unique: true })
export class StockItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  locationId: string;

  @ManyToOne(() => StockLocation, { eager: true })
  @JoinColumn({ name: 'locationId' })
  location: StockLocation;

  @Column({ type: 'uuid' })
  variantId: string;

  @ManyToOne(() => ProductVariant, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column({ type: 'integer', default: 0 })
  quantity: number; // Available quantity

  @Column({ type: 'integer', default: 0 })
  reservedQuantity: number; // Reserved for orders

  @Column({ type: 'integer', default: 0 })
  minStockLevel: number; // Alert when below this

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}















