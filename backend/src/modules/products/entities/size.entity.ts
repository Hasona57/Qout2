import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sizes')
@Index(['code'], { unique: true })
export class Size {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // e.g., 'S', 'M', 'L', 'XL', 'XXL'

  @Column({ type: 'varchar', length: 100 })
  nameAr: string;

  @Column({ type: 'varchar', length: 100 })
  nameEn: string;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}








