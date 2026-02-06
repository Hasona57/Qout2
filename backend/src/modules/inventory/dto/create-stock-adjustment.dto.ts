import { IsUUID, IsArray, ValidateNested, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class StockAdjustmentItemDto {
  @ApiProperty()
  @IsUUID()
  variantId: string;

  @ApiProperty()
  @IsNumber()
  quantityChange: number; // Positive for increase, negative for decrease
}

export class CreateStockAdjustmentDto {
  @ApiProperty()
  @IsUUID()
  locationId: string;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty({ type: [StockAdjustmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockAdjustmentItemDto)
  items: StockAdjustmentItemDto[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}















