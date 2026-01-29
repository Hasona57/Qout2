import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('colors')
@Index(['code'], { unique: true })
export class Color {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // e.g., 'BLACK', 'WHITE', 'NAVY'

  @Column({ type: 'varchar', length: 100 })
  nameAr: string;

  @Column({ type: 'varchar', length: 100 })
  nameEn: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  hexCode: string; // Color hex code for UI display

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}










