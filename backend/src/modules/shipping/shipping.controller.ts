import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('calculate')
  @Public()
  @ApiOperation({ summary: 'Calculate shipping fee' })
  calculateShipping(@Body('addressId') addressId: string, @Body('items') items: any[]) {
    return this.shippingService.calculateShippingFee(addressId, items);
  }
}






