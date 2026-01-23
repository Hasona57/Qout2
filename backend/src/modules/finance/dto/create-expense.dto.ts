import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseDto {
    @ApiProperty({ example: 'Office Rent' })
    @IsString()
    title: string;

    @ApiProperty({ example: 5000 })
    @IsNumber()
    amount: number;

    @ApiProperty({ example: 'rent', enum: ['rent', 'electricity', 'water', 'salary', 'other'] })
    @IsEnum(['rent', 'electricity', 'water', 'salary', 'other'])
    type: string;

    @ApiProperty({ example: 'Monthly office rent', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: '2024-02-01' })
    @IsDateString()
    date: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    @IsOptional()
    isRecurring?: boolean;
}
