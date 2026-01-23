import { IsUUID, IsArray, ValidateNested, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class InvoiceItemDto {
  @ApiProperty()
  @IsUUID()
  variantId: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  costPrice?: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty()
  @IsUUID()
  locationId: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}






