import { TICKET_STATUS_TRANSITIONS, TicketStatus } from './ticket-status.enum';

describe('TICKET_STATUS_TRANSITIONS', () => {
  it.each([
    [TicketStatus.NEW, TicketStatus.OPEN],
    [TicketStatus.OPEN, TicketStatus.IN_PROGRESS],
    [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
    [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_CUSTOMER],
    [TicketStatus.WAITING_CUSTOMER, TicketStatus.IN_PROGRESS],
    [TicketStatus.RESOLVED, TicketStatus.CLOSED],
  ])('allows %s -> %s', (from, to) => {
    expect(TICKET_STATUS_TRANSITIONS[from]).toContain(to);
  });

  it.each([
    [TicketStatus.NEW, TicketStatus.RESOLVED],
    [TicketStatus.NEW, TicketStatus.IN_PROGRESS],
    [TicketStatus.OPEN, TicketStatus.RESOLVED],
    [TicketStatus.CLOSED, TicketStatus.OPEN],
  ])('forbids %s -> %s', (from, to) => {
    expect(TICKET_STATUS_TRANSITIONS[from]).not.toContain(to);
  });

  it('has no outgoing transitions from closed', () => {
    expect(TICKET_STATUS_TRANSITIONS[TicketStatus.CLOSED]).toEqual([]);
  });
});
