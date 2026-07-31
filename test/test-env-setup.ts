import { existsSync, mkdtempSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const dir = mkdtempSync(join(tmpdir(), 'resolve-ara-e2e-'));
const dbPath = join(dir, 'tickets-e2e.sqlite');

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
}

process.env.DATABASE_PATH = dbPath;
