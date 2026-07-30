import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { TicketsService } from './tickets.service';

const DEFAULT_ACTOR = 'api';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() dto: CreateTicketDto, @Headers('x-actor') actor?: string) {
    return this.ticketsService.create(dto, actor || DEFAULT_ACTOR);
  }

  @Get()
  findAll(@Query('status') status?: string, @Query('priority') priority?: string) {
    return this.ticketsService.findAll({ status, priority });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Headers('x-actor') actor?: string,
  ) {
    return this.ticketsService.changeStatus(id, dto, actor || DEFAULT_ACTOR);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Headers('x-actor') actor?: string,
  ) {
    return this.ticketsService.addComment(id, dto, actor || DEFAULT_ACTOR);
  }
}
