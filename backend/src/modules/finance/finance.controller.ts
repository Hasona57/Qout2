import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Post('expenses')
    @ApiOperation({ summary: 'Create expense' })
    create(@Body() createExpenseDto: CreateExpenseDto) {
        return this.financeService.create(createExpenseDto);
    }

    @Get('expenses')
    @ApiOperation({ summary: 'Get all expenses' })
    findAll() {
        return this.financeService.findAll();
    }

    @Get('expenses/recurring')
    @ApiOperation({ summary: 'Get recurring expenses' })
    findRecurring() {
        return this.financeService.findRecuring();
    }

    @Get('expenses/:id')
    @ApiOperation({ summary: 'Get expense by id' })
    findOne(@Param('id') id: string) {
        return this.financeService.findOne(id);
    }

    @Patch('expenses/:id')
    @ApiOperation({ summary: 'Update expense' })
    update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
        return this.financeService.update(id, updateExpenseDto);
    }

    @Delete('expenses/:id')
    @ApiOperation({ summary: 'Delete expense' })
    remove(@Param('id') id: string) {
        return this.financeService.remove(id);
    }

    @Get('payroll')
    @ApiOperation({ summary: 'Get payroll data' })
    getPayroll() {
        return this.financeService.getPayroll();
    }
    @Get('safe')
    @ApiOperation({ summary: 'Get Safe Status' })
    getSafeStatus(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.financeService.getSafeStatus(start, end);
    }
}
