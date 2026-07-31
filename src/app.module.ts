import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from './audit/audit.module';
import { AuditLog } from './audit/entities/audit-log.entity';
import { StatsModule } from './stats/stats.module';
import { Comment } from './tickets/entities/comment.entity';
import { Ticket } from './tickets/entities/ticket.entity';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_PATH || 'tickets.sqlite',
      entities: [Ticket, Comment, AuditLog],
      synchronize: true,
    }),
    TicketsModule,
    AuditModule,
    StatsModule,
  ],
})
export class AppModule {}
