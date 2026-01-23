import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string; // e.g., 'products.create', 'inventory.view', 'sales.pos'

  @Column({ type: 'varchar', length: 100, nullable: true })
  resource: string; // e.g., 'products', 'inventory', 'sales'

  @Column({ type: 'varchar', length: 50, nullable: true })
  action: string; // e.g., 'create', 'read', 'update', 'delete'

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}






