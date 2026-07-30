import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface LogEntryInput {
  actor: string;
  action: string;
  ticketId?: string | null;
  details?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(entry: LogEntryInput): Promise<AuditLog> {
    const record = this.auditRepository.create({
      actor: entry.actor,
      action: entry.action,
      ticketId: entry.ticketId ?? null,
      details: entry.details ? JSON.stringify(entry.details) : null,
    });
    return this.auditRepository.save(record);
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditRepository.find({ order: { at: 'ASC' } });
  }
}
