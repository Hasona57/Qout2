import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { StockLocation } from './stock-location.entity';
import { User } from '../../users/entities/user.entity';
import { StockAdjustmentItem } from './stock-adjustment-item.entity';

@Entity('stock_adjustments')
export class StockAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  adjustmentNumber: string; // e.g., 'ADJ-2024-001'

  @Column({ type: 'uuid' })
  locationId: string;

  @ManyToOne(() => StockLocation)
  @JoinColumn({ name: 'locationId' })
  location: StockLocation;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'varchar', length: 50 })
  reason: string; // damage, loss, found, correction, etc.

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => StockAdjustmentItem, (item) => item.adjustment, { cascade: true })
  items: StockAdjustmentItem[];

  @CreateDateColumn()
  createdAt: Date;
}














