import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) { }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  findAllInvoices() {
    return this.salesService.findAllInvoices();
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Create invoice (POS)' })
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto, @CurrentUser() user: any) {
    return this.salesService.createInvoice(createInvoiceDto, user.id);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOneInvoice(@Param('id') id: string) {
    return this.salesService.findOneInvoice(id);
  }

  @Post('invoices/:id/complete')
  @ApiOperation({ summary: 'Complete invoice' })
  completeInvoice(@Param('id') id: string) {
    return this.salesService.completeInvoice(id);
  }

  @Post('invoices/:id/cancel')
  @ApiOperation({ summary: 'Cancel invoice' })
  cancelInvoice(@Param('id') id: string) {
    return this.salesService.cancelInvoice(id);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Add payment to invoice' })
  createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.salesService.createPayment(createPaymentDto);
  }

  @Post('returns')
  @ApiOperation({ summary: 'Create return' })
  createReturn(@Body() createReturnDto: CreateReturnDto, @CurrentUser() user: any) {
    return this.salesService.createReturn(createReturnDto, user.id);
  }

  @Get('returns')
  @ApiOperation({ summary: 'Get returns by invoiceId or orderId' })
  findReturns(@Query('invoiceId') invoiceId?: string, @Query('orderId') orderId?: string) {
    return this.salesService.findReturns(invoiceId, orderId);
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Get all payment methods' })
  findAllPaymentMethods() {
    return this.salesService.findAllPaymentMethods();
  }
}

