import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard overview' })
  @ApiQuery({ name: 'countryId', required: false })
  @ApiResponse({ status: 200, description: 'Dashboard overview data' })
  getOverview(
    @CurrentUser() user: any,
    @Query('countryId') countryId?: string,
  ) {
    return this.dashboardService.getOverview(user, countryId);
  }
}
