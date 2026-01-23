import { IsUUID, IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ReturnItemDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  invoiceItemId?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  orderItemId?: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class CreateReturnDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  invoiceId?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty({ type: [ReturnItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  refundShipping?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  refundMethod?: string; // vodafone_cash, instapay, cash_pos, cod
}

