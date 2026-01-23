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
import { Product } from './product.entity';
import { Size } from './size.entity';
import { Color } from './color.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/numeric.transformer';

@Entity('product_variants')
@Index(['sku'], { unique: true })
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'uuid' })
  sizeId: string;

  @ManyToOne(() => Size, { eager: true })
  @JoinColumn({ name: 'sizeId' })
  size: Size;

  @Column({ type: 'uuid' })
  colorId: string;

  @ManyToOne(() => Color, { eager: true })
  @JoinColumn({ name: 'colorId' })
  color: Color;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string; // Unique SKU per variant

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: new ColumnNumericTransformer() })
  weight: number; // Weight in kg (for shipping calculation)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: new ColumnNumericTransformer() })
  costPrice: number; // Override product cost price if different

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: new ColumnNumericTransformer() })
  retailPrice: number; // Override product retail price if different

  @Column({ type: 'varchar', length: 50, nullable: true })
  barcode: string; // Barcode for POS scanning

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}






