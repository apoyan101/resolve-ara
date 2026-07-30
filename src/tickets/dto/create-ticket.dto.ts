import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TicketPriority } from '../ticket-priority.enum';

export class CreateTicketDto {
  @IsString({ message: 'subject must be a string' })
  @IsNotEmpty({ message: 'subject should not be empty' })
  subject: string;

  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description should not be empty' })
  description: string;

  @IsEmail({}, { message: 'customerEmail must be a valid email address' })
  customerEmail: string;

  @IsEnum(TicketPriority, {
    message: `priority must be one of the following values: ${Object.values(TicketPriority).join(', ')}`,
  })
  priority: TicketPriority;
}
