import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketPriority } from '../tickets/ticket-priority.enum';
import { TicketStatus } from '../tickets/ticket-status.enum';

export interface StatsResponse {
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<TicketPriority, number>;
  averageResolutionTimeMs: number | null;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
  ) {}

  async getStats(): Promise<StatsResponse> {
    const tickets = await this.ticketsRepository.find();

    const byStatus = Object.values(TicketStatus).reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {} as Record<TicketStatus, number>,
    );
    const byPriority = Object.values(TicketPriority).reduce(
      (acc, priority) => ({ ...acc, [priority]: 0 }),
      {} as Record<TicketPriority, number>,
    );

    let resolutionTotalMs = 0;
    let resolvedCount = 0;

    for (const ticket of tickets) {
      byStatus[ticket.status] += 1;
      byPriority[ticket.priority] += 1;

      if (ticket.resolvedAt) {
        resolutionTotalMs += ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
        resolvedCount += 1;
      }
    }

    return {
      byStatus,
      byPriority,
      averageResolutionTimeMs: resolvedCount > 0 ? resolutionTotalMs / resolvedCount : null,
    };
  }
}
