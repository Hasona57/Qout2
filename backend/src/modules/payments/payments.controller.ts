import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('paymob/create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Paymob payment' })
  createPaymobPayment(@Body() body: { orderId: string; amount: number; customerInfo: any }) {
    return this.paymentsService.createPaymobPayment(body.orderId, body.amount, body.customerInfo);
  }

  @Post('fawry/create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Fawry payment' })
  createFawryPayment(@Body() body: { orderId: string; amount: number; customerInfo: any }) {
    return this.paymentsService.createFawryPayment(body.orderId, body.amount, body.customerInfo);
  }

  @Post('callback/:provider')
  @Public()
  @ApiOperation({ summary: 'Payment callback webhook' })
  paymentCallback(@Param('provider') provider: string, @Body() data: any) {
    return this.paymentsService.verifyPaymentCallback(provider, data);
  }
}


