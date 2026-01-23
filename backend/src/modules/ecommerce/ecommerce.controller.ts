import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EcommerceService } from './ecommerce.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('ecommerce')
@Controller('ecommerce')
export class EcommerceController {
  constructor(private readonly ecommerceService: EcommerceService) { }

  @Get('cart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user cart' })
  getCart(@CurrentUser() user: any) {
    return this.ecommerceService.getOrCreateCart(user.id);
  }

  @Post('cart/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to cart' })
  addToCart(
    @CurrentUser() user: any,
    @Body('variantId') variantId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.ecommerceService.addToCart(user.id, variantId, quantity);
  }

  @Patch('cart/items/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateCartItem(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.ecommerceService.updateCartItem(user.id, id, quantity);
  }

  @Delete('cart/items/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from cart' })
  removeFromCart(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ecommerceService.removeFromCart(user.id, id);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user orders' })
  async findAllOrders(@CurrentUser() user: any) {
    console.log(`Fetching orders for user: ${user.id}, Role: ${user.role}`);

    // Check for admin role
    const roleName = user.role?.name || user.role;
    if (typeof roleName === 'string' && roleName.toLowerCase() === 'admin') {
      const allOrders = await this.ecommerceService.findAllOrders();
      console.log(`Admin fetching all orders: Found ${allOrders.length}`);
      return allOrders;
    }
    return this.ecommerceService.findAllOrders(user.id);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order from cart' })
  createOrder(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ecommerceService.createOrder(createOrderDto, user.id);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  findOneOrder(@Param('id') id: string) {
    return this.ecommerceService.findOneOrder(id);
  }

  @Patch('orders/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any
  ) {
    return this.ecommerceService.updateOrderStatus(id, status, user.id);
  }
}

