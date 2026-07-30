import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Support Ticket API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, stopAtFirstError: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const validPayload = {
    subject: 'Cannot login',
    description: 'Getting a 500 error on the login page',
    customerEmail: 'customer@example.com',
    priority: 'high',
  };

  function createTicket(overrides: Record<string, unknown> = {}, actor?: string) {
    const req = request(app.getHttpServer())
      .post('/tickets')
      .send({ ...validPayload, ...overrides });
    if (actor) {
      req.set('X-Actor', actor);
    }
    return req;
  }

  describe('POST /tickets validation', () => {
    it('rejects an empty subject', async () => {
      const res = await createTicket({ subject: '' }).expect(400);
      expect(res.body.message).toEqual(expect.arrayContaining([expect.stringContaining('subject')]));
    });

    it('rejects an empty description', async () => {
      const res = await createTicket({ description: '' }).expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('description')]),
      );
    });

    it('rejects an invalid customer email', async () => {
      const res = await createTicket({ customerEmail: 'not-an-email' }).expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('customerEmail')]),
      );
    });

    it('rejects a priority outside the whitelist', async () => {
      const res = await createTicket({ priority: 'critical' }).expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('priority')]),
      );
    });

    it('creates a ticket with valid input', async () => {
      const res = await createTicket().expect(201);
      expect(res.body).toMatchObject({
        subject: validPayload.subject,
        description: validPayload.description,
        customerEmail: validPayload.customerEmail,
        priority: 'high',
        status: 'new',
      });
      expect(res.body.id).toBeDefined();
    });
  });

  describe('Status state machine', () => {
    it('allows the full happy path through every whitelisted transition', async () => {
      const create = await createTicket().expect(201);
      const id = create.body.id;

      const transitions = [
        'open',
        'in_progress',
        'waiting_customer',
        'in_progress',
        'resolved',
        'closed',
      ];

      for (const to of transitions) {
        const res = await request(app.getHttpServer())
          .post(`/tickets/${id}/status`)
          .send({ to })
          .expect(201);
        expect(res.body.status).toBe(to);
      }

      const final = await request(app.getHttpServer()).get(`/tickets/${id}`).expect(200);
      expect(final.body.status).toBe('closed');
    });

    it('rejects skipping straight from new to resolved', async () => {
      const create = await createTicket().expect(201);
      const id = create.body.id;

      const res = await request(app.getHttpServer())
        .post(`/tickets/${id}/status`)
        .send({ to: 'resolved' })
        .expect(400);

      expect(res.body.message).toEqual(expect.stringContaining('open'));
    });

    it('rejects transitioning out of a terminal closed status', async () => {
      const create = await createTicket().expect(201);
      const id = create.body.id;

      for (const to of ['open', 'in_progress', 'resolved', 'closed']) {
        await request(app.getHttpServer()).post(`/tickets/${id}/status`).send({ to }).expect(201);
      }

      const res = await request(app.getHttpServer())
        .post(`/tickets/${id}/status`)
        .send({ to: 'open' })
        .expect(400);

      expect(res.body.message).toEqual(expect.stringContaining('No further transitions'));
    });

    it('rejects an unknown status value with a 400', async () => {
      const create = await createTicket().expect(201);
      const id = create.body.id;

      await request(app.getHttpServer())
        .post(`/tickets/${id}/status`)
        .send({ to: 'archived' })
        .expect(400);
    });
  });

  describe('Comments', () => {
    it('adds a comment and returns it when fetching the ticket', async () => {
      const create = await createTicket().expect(201);
      const id = create.body.id;

      await request(app.getHttpServer())
        .post(`/tickets/${id}/comments`)
        .send({ author: 'agent-smith', body: 'Investigating now', internal: true })
        .expect(201);

      const res = await request(app.getHttpServer()).get(`/tickets/${id}`).expect(200);
      expect(res.body.comments).toHaveLength(1);
      expect(res.body.comments[0]).toMatchObject({
        author: 'agent-smith',
        body: 'Investigating now',
        internal: true,
      });
    });

    it('returns 404 when commenting on a missing ticket', async () => {
      await request(app.getHttpServer())
        .post('/tickets/00000000-0000-0000-0000-000000000000/comments')
        .send({ author: 'agent-smith', body: 'hi', internal: false })
        .expect(404);
    });
  });

  describe('GET /tickets filters', () => {
    it('filters tickets by status and priority', async () => {
      const urgent = await createTicket({ priority: 'urgent', subject: 'Server down' }).expect(
        201,
      );
      await request(app.getHttpServer())
        .post(`/tickets/${urgent.body.id}/status`)
        .send({ to: 'open' })
        .expect(201);

      const byPriority = await request(app.getHttpServer())
        .get('/tickets?priority=urgent')
        .expect(200);
      expect(byPriority.body.every((t: any) => t.priority === 'urgent')).toBe(true);
      expect(byPriority.body.some((t: any) => t.id === urgent.body.id)).toBe(true);

      const byStatus = await request(app.getHttpServer()).get('/tickets?status=open').expect(200);
      expect(byStatus.body.every((t: any) => t.status === 'open')).toBe(true);
      expect(byStatus.body.some((t: any) => t.id === urgent.body.id)).toBe(true);
    });
  });

  describe('Audit log', () => {
    it('records ticket creation, status changes, and comments with the acting actor', async () => {
      const create = await createTicket({ subject: 'Audit me' }, 'alice').expect(201);
      const id = create.body.id;

      await request(app.getHttpServer())
        .post(`/tickets/${id}/status`)
        .set('X-Actor', 'bob')
        .send({ to: 'open' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/tickets/${id}/comments`)
        .set('X-Actor', 'carol')
        .send({ author: 'carol', body: 'noted', internal: false })
        .expect(201);

      const audit = await request(app.getHttpServer()).get('/audit').expect(200);
      const entriesForTicket = audit.body.filter((entry: any) => entry.ticketId === id);

      expect(entriesForTicket).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ actor: 'alice', action: 'ticket.created', ticketId: id }),
          expect.objectContaining({ actor: 'bob', action: 'ticket.status_changed', ticketId: id }),
          expect.objectContaining({ actor: 'carol', action: 'comment.added', ticketId: id }),
        ]),
      );
      entriesForTicket.forEach((entry: any) => expect(entry.at).toBeDefined());
    });

    it('defaults the actor to "api" when no X-Actor header is supplied', async () => {
      const create = await createTicket({ subject: 'No actor header' }).expect(201);
      const audit = await request(app.getHttpServer()).get('/audit').expect(200);
      const entry = audit.body.find(
        (e: any) => e.ticketId === create.body.id && e.action === 'ticket.created',
      );
      expect(entry.actor).toBe('api');
    });
  });

  describe('GET /stats', () => {
    it('reports counts by status/priority and average resolution time', async () => {
      const create = await createTicket({ priority: 'low', subject: 'Stats ticket' }).expect(201);
      const id = create.body.id;
      for (const to of ['open', 'in_progress', 'resolved']) {
        await request(app.getHttpServer()).post(`/tickets/${id}/status`).send({ to }).expect(201);
      }

      const stats = await request(app.getHttpServer()).get('/stats').expect(200);
      expect(stats.body.byStatus.resolved).toBeGreaterThanOrEqual(1);
      expect(stats.body.byPriority.low).toBeGreaterThanOrEqual(1);
      expect(typeof stats.body.averageResolutionTimeMs).toBe('number');
      expect(stats.body.averageResolutionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});
