import { IsEnum } from 'class-validator';
import { TicketStatus } from '../ticket-status.enum';

export class UpdateStatusDto {
  @IsEnum(TicketStatus, {
    message: `to must be one of the following values: ${Object.values(TicketStatus).join(', ')}`,
  })
  to: TicketStatus;
}
