import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('attachments')
@Index(['entityType', 'entityId'])
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  entityType: string; // product, invoice, order, bom, etc.

  @Column({ type: 'uuid' })
  entityId: string; // ID of the related entity

  @Column({ type: 'varchar', length: 500 })
  url: string; // MinIO URL

  @Column({ type: 'varchar', length: 200 })
  fileName: string;

  @Column({ type: 'varchar', length: 50 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number; // in bytes

  @CreateDateColumn()
  createdAt: Date;
}














