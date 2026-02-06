import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StockLocation } from './stock-location.entity';
import { User } from '../../users/entities/user.entity';
import { StockTransferItem } from './stock-transfer-item.entity';

@Entity('stock_transfers')
export class StockTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  transferNumber: string; // e.g., 'TRF-2024-001'

  @Column({ type: 'uuid' })
  fromLocationId: string;

  @ManyToOne(() => StockLocation)
  @JoinColumn({ name: 'fromLocationId' })
  fromLocation: StockLocation;

  @Column({ type: 'uuid' })
  toLocationId: string;

  @ManyToOne(() => StockLocation)
  @JoinColumn({ name: 'toLocationId' })
  toLocation: StockLocation;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, in_transit, completed, cancelled

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => StockTransferItem, (item) => item.transfer, { cascade: true })
  items: StockTransferItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
}















