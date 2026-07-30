import { Controller, Get } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll() {
    const entries = await this.auditService.findAll();
    return entries.map((entry) => ({
      id: entry.id,
      actor: entry.actor,
      action: entry.action,
      ticketId: entry.ticketId,
      at: entry.at,
      details: entry.details ? JSON.parse(entry.details) : null,
    }));
  }
}
