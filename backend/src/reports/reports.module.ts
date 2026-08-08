import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DrizzleModule } from 'src/_common/drizzle/drizzle.module';
import { ReportRepository } from './repository/report.repository';

@Module({
  imports: [DrizzleModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportRepository],
  exports: [ReportRepository]
})
export class ReportsModule { }
