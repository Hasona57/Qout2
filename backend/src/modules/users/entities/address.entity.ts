import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.addresses)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 100 })
  label: string; // Home, Work, etc.

  @Column({ type: 'varchar', length: 100 })
  governorate: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 200 })
  street: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  buildingNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  floor: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apartment: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}










