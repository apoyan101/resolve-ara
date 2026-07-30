# Resolve — Support Ticket API

A NestJS API for managing support tickets: creation, status workflow,
comments, an audit trail, and aggregate stats. Data is persisted to a
SQLite database file on disk, so it survives process restarts.

## Requirements

- Node.js 18+ (tested on Node 22)
- npm

## Running locally

```bash
npm install
npm run start
```

The app listens on `http://localhost:3000`. On first run it creates a
`tickets.sqlite` file in the project root (schema is created automatically
via TypeORM `synchronize`) and reuses it on subsequent runs — restarting the
process does not lose data.

Useful variants:

- `npm run start:dev` — watch mode, restarts on file changes.
- `npm run build && npm run start:prod` — compiles to `dist/` and runs the
  compiled output.
- `DATABASE_PATH=/some/path.sqlite npm run start` — use a different SQLite
  file location (handy for running multiple instances side by side).

## API

All endpoints accept/return JSON. Requests that mutate state accept an
optional `X-Actor` header identifying who performed the action (used for the
audit log); it defaults to `"api"` when omitted.

### Tickets

- `POST /tickets` — create a ticket.
  ```json
  { "subject": "Cannot login", "description": "Getting a 500 error", "customerEmail": "user@example.com", "priority": "high" }
  ```
  `priority` must be one of `low | normal | high | urgent`. `subject` and
  `description` must be non-empty strings, and `customerEmail` must be a
  valid email address. Invalid input returns `400` with a `message` array
  naming the offending field(s).

- `GET /tickets` — list tickets. Supports `?status=` and `?priority=` query
  filters.

- `GET /tickets/:id` — fetch a single ticket, including its comments.
  Returns `404` if the ticket doesn't exist.

- `POST /tickets/:id/status` — change a ticket's status.
  ```json
  { "to": "open" }
  ```
  Transitions follow a whitelist (see below). A disallowed transition
  returns `400` with a message listing the allowed next states.

- `POST /tickets/:id/comments` — add a comment.
  ```json
  { "author": "agent-smith", "body": "Investigating now", "internal": true }
  ```

### Status workflow

```
new -> open -> in_progress -> resolved -> closed
                  ^  |
                  |  v
              waiting_customer
```

Allowed transitions:

| From                | To                              |
| ------------------- | -------------------------------- |
| `new`                | `open`                          |
| `open`               | `in_progress`                   |
| `in_progress`        | `resolved`, `waiting_customer`  |
| `waiting_customer`   | `in_progress`                   |
| `resolved`           | `closed`                        |
| `closed`             | *(terminal, no further moves)*  |

Any other transition is rejected with `400`.

### Audit log

- `GET /audit` — every ticket creation, status change, and comment
  produces an entry `{ id, actor, action, ticketId, at, details }`, visible
  here in chronological order.

### Stats

- `GET /stats` — returns:
  ```json
  {
    "byStatus": { "new": 2, "open": 1, "in_progress": 0, "waiting_customer": 0, "resolved": 1, "closed": 3 },
    "byPriority": { "low": 1, "normal": 3, "high": 2, "urgent": 0 },
    "averageResolutionTimeMs": 123456
  }
  ```
  `averageResolutionTimeMs` is the average time from a ticket's creation
  (`new`) to the moment it first became `resolved`, across all tickets that
  have reached `resolved`; it's `null` if none have yet.

## Tests

```bash
npm test         # unit tests (status transition table)
npm run test:e2e # end-to-end tests against a real, temporary SQLite file
```

The e2e suite (`test/app.e2e-spec.ts`) covers:

- Input validation for ticket creation (empty subject/description, invalid
  email, invalid priority).
- Every allowed status transition, walked end-to-end from `new` to
  `closed`, including the `in_progress <-> waiting_customer` branch.
- Multiple forbidden transitions (e.g. `new -> resolved`, transitioning out
  of `closed`, an unrecognized status value).
- Comments being attached to a ticket and returned by `GET /tickets/:id`.
- Filtering `GET /tickets` by `status` and `priority`.
- Audit entries being written (with the correct actor) for ticket creation,
  status changes, and comments, and the default `"api"` actor when no
  `X-Actor` header is sent.
- `GET /stats` counts and average resolution time.

Each e2e run uses its own temporary SQLite file (created via
`test/test-env-setup.ts`) so tests never touch your local `tickets.sqlite`.

## Project structure

```
src/
  app.module.ts          # wires up TypeORM (SQLite) + feature modules
  main.ts                 # bootstraps the app on port 3000
  tickets/                 # tickets, comments, status state machine
  audit/                    # audit log entity/service/controller
  stats/                     # aggregate stats endpoint
test/
  app.e2e-spec.ts           # end-to-end API tests
```
