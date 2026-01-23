import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.productsService.findAll({
      categoryId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
      locationId,
    });
  }

  @Get('sizes')
  @Public()
  @ApiOperation({ summary: 'Get all sizes' })
  findAllSizes() {
    return this.productsService.findAllSizes();
  }

  @Get('colors')
  @Public()
  @ApiOperation({ summary: 'Get all colors' })
  findAllColors() {
    return this.productsService.findAllColors();
  }



  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get all categories' })
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('sku/:sku')
  @Public()
  @ApiOperation({ summary: 'Get product by SKU' })
  findBySku(@Param('sku') sku: string) {
    return this.productsService.findBySku(sku);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // Variants
  @Post(':productId/variants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product variant' })
  createVariant(
    @Param('productId') productId: string,
    @Body() createVariantDto: CreateProductVariantDto,
  ) {
    return this.productsService.createVariant(productId, createVariantDto);
  }

  @Get('variants/barcode/:barcode')
  @Public()
  @ApiOperation({ summary: 'Get variant by barcode (for POS)' })
  findVariantByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findVariantByBarcode(barcode);
  }

  @Delete('variants/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product variant' })
  deleteVariant(@Param('id') id: string) {
    return this.productsService.deleteVariant(id);
  }

  @Delete('all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all products' })
  deleteAllProducts() {
    return this.productsService.deleteAllProducts();
  }
}
