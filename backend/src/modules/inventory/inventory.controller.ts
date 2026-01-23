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
import { InventoryService } from './inventory.service';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('locations')
  @ApiOperation({ summary: 'Get all stock locations' })
  findAllLocations() {
    return this.inventoryService.findAllLocations();
  }

  @Get('stock')
  @ApiOperation({ summary: 'Get all stock items' })
  getAllStock(@Query('locationId') locationId?: string) {
    return this.inventoryService.getAllStock(locationId);
  }

  @Get('stock/:variantId')
  @Public()
  @ApiOperation({ summary: 'Get stock for a variant (public for store)' })
  getStock(@Param('variantId') variantId: string, @Query('locationId') locationId?: string) {
    return this.inventoryService.getStock(variantId, locationId);
  }

  @Post('transfers')
  @ApiOperation({ summary: 'Create stock transfer' })
  createTransfer(@Body() createTransferDto: CreateStockTransferDto, @CurrentUser() user: any) {
    return this.inventoryService.createTransfer(createTransferDto, user.id);
  }

  @Post('transfers/:id/complete')
  @ApiOperation({ summary: 'Complete stock transfer' })
  completeTransfer(@Param('id') id: string) {
    return this.inventoryService.completeTransfer(id);
  }

  @Post('adjustments')
  @ApiOperation({ summary: 'Create stock adjustment' })
  createAdjustment(@Body() createAdjustmentDto: CreateStockAdjustmentDto, @CurrentUser() user: any) {
    return this.inventoryService.createAdjustment(createAdjustmentDto, user.id);
  }

  @Post('assign-stock')
  @ApiOperation({ summary: 'Assign stock to variant' })
  assignStockToVariant(
    @Body() body: { variantId: string; locationId: string; quantity: number; minStockLevel?: number },
  ) {
    return this.inventoryService.assignStockToVariant(
      body.variantId,
      body.locationId,
      body.quantity,
      body.minStockLevel,
    );
  }
}

