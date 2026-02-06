import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Get sales report' })
  getSalesReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportsService.getSalesReport(new Date(startDate), new Date(endDate));
  }

  @Get('commission')
  @ApiOperation({ summary: 'Get commission report' })
  getCommissionReport(
    @Query('employeeId') employeeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getCommissionReport(employeeId, new Date(startDate), new Date(endDate));
  }
}















