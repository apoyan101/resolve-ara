import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Comment } from './entities/comment.entity';
import { Ticket } from './entities/ticket.entity';
import { TICKET_STATUS_TRANSITIONS, TicketStatus } from './ticket-status.enum';

export interface FindAllFilters {
  status?: string;
  priority?: string;
}

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateTicketDto, actor: string): Promise<Ticket> {
    const ticket = this.ticketsRepository.create({
      subject: dto.subject,
      description: dto.description,
      customerEmail: dto.customerEmail,
      priority: dto.priority,
      status: TicketStatus.NEW,
    });
    const saved = await this.ticketsRepository.save(ticket);

    await this.auditService.log({
      actor,
      action: 'ticket.created',
      ticketId: saved.id,
      details: { subject: saved.subject, priority: saved.priority },
    });

    return saved;
  }

  async findAll(filters: FindAllFilters): Promise<Ticket[]> {
    const where: Record<string, unknown> = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    return this.ticketsRepository.find({ where, order: { createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['comments'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    ticket.comments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return ticket;
  }

  async changeStatus(id: string, dto: UpdateStatusDto, actor: string): Promise<Ticket> {
    const ticket = await this.getOrThrow(id);
    const allowed = TICKET_STATUS_TRANSITIONS[ticket.status] ?? [];

    if (!allowed.includes(dto.to)) {
      const allowedMessage =
        allowed.length > 0
          ? `Allowed next states: ${allowed.join(', ')}`
          : 'No further transitions are allowed from this status';
      throw new BadRequestException(
        `Cannot transition ticket from '${ticket.status}' to '${dto.to}'. ${allowedMessage}`,
      );
    }

    const previousStatus = ticket.status;
    ticket.status = dto.to;
    if (dto.to === TicketStatus.RESOLVED && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }
    const saved = await this.ticketsRepository.save(ticket);

    await this.auditService.log({
      actor,
      action: 'ticket.status_changed',
      ticketId: saved.id,
      details: { from: previousStatus, to: saved.status },
    });

    return saved;
  }

  async addComment(id: string, dto: CreateCommentDto, actor: string): Promise<Comment> {
    const ticket = await this.getOrThrow(id);

    const comment = this.commentsRepository.create({
      ticketId: ticket.id,
      author: dto.author,
      body: dto.body,
      internal: dto.internal,
    });
    const saved = await this.commentsRepository.save(comment);

    await this.auditService.log({
      actor,
      action: 'comment.added',
      ticketId: ticket.id,
      details: { author: dto.author, internal: dto.internal },
    });

    return saved;
  }

  private async getOrThrow(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    return ticket;
  }
}
