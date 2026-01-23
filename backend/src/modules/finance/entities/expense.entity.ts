import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('expenses')
export class Expense {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @Column({ type: 'varchar', length: 50 })
    type: string; // 'rent', 'electricity', 'water', 'salary', 'other'

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'boolean', default: false })
    isRecurring: boolean; // If true, system reminds every month

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
