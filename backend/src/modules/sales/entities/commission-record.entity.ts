import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { User } from '../../users/entities/user.entity';

@Entity('commission_records')
@Index(['employeeId', 'invoiceId'])
export class CommissionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string; // Sales employee

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'employeeId' })
  employee: User;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  profitMargin: string; // Total profit margin from invoice

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commissionRate: string; // Employee commission rate (percentage)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commissionAmount: string; // (profitMargin * commissionRate / 100)

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, approved, paid

  @CreateDateColumn()
  createdAt: Date;
}










