import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { Category } from './category.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/numeric.transformer';

@Entity('products')
@Index(['sku'], { unique: true, where: '"sku" IS NOT NULL' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  nameAr: string;

  @Column({ type: 'varchar', length: 200 })
  nameEn: string;

  @Column({ type: 'text', nullable: true })
  descriptionAr: string;

  @Column({ type: 'text', nullable: true })
  descriptionEn: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  sku: string; // Base SKU (variants have their own SKUs)

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: new ColumnNumericTransformer() })
  costPrice: number; // Base cost price

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: new ColumnNumericTransformer() })
  retailPrice: number; // Base retail price

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}








