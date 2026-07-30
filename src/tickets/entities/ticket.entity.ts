import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TicketPriority } from '../ticket-priority.enum';
import { TicketStatus } from '../ticket-status.enum';
import { Comment } from './comment.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subject: string;

  @Column('text')
  description: string;

  @Column()
  customerEmail: string;

  @Column({ type: 'varchar', default: TicketPriority.NORMAL })
  priority: TicketPriority;

  @Column({ type: 'varchar', default: TicketStatus.NEW })
  status: TicketStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  resolvedAt: Date | null;

  @OneToMany(() => Comment, (comment) => comment.ticket)
  comments: Comment[];
}
