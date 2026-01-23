import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from '@/modules/dashboard/dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    async getDashboardStats() {
        return this.dashboardService.getDashboardStats();
    }
}
