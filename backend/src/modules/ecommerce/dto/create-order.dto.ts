import { IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  deliveryAddressId: string;

  @ApiProperty({ example: 'online' })
  @IsString()
  paymentMethod: string; // 'online' or 'cod'
}









