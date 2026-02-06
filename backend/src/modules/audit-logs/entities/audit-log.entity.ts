import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['userId'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string; // User who performed the action

  @Column({ type: 'varchar', length: 100 })
  entityType: string; // product, invoice, order, etc.

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'varchar', length: 50 })
  action: string; // create, update, delete, view

  @Column({ type: 'jsonb', nullable: true })
  oldValues: any; // Previous values

  @Column({ type: 'jsonb', nullable: true })
  newValues: any; // New values

  @Column({ type: 'varchar', length: 200, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}














