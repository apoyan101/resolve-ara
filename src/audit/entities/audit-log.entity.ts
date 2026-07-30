import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  actor: string;

  @Column()
  action: string;

  @Column({ type: 'varchar', nullable: true })
  ticketId: string | null;

  @CreateDateColumn()
  at: Date;

  @Column({ type: 'text', nullable: true })
  details: string | null;
}
