import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StockItem } from './stock-item.entity';

@Entity('stock_locations')
export class StockLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // 'Factory', 'Store', 'Warehouse', etc.

  @Column({ type: 'varchar', length: 200, nullable: true })
  address: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => StockItem, (stockItem) => stockItem.location)
  stockItems: StockItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}








