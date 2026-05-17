#!/usr/bin/env node
// Tracker — one-command dev launcher
// Usage:
//   node dev.js           → start with local DB via Docker
//   node dev.js --seed    → also seed demo data (same as `npm run demo`)
//   node dev.js --skip-db → skip Docker DB (use existing local DB)
'use strict';

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

const ROOT        = __dirname;
const BACKEND_DIR = path.join(ROOT, 'backend');
const FRONTEND_DIR = path.join(ROOT, 'frontend');

const SEED    = process.argv.includes('--seed') || process.argv.includes('demo');
const SKIP_DB = process.argv.includes('--skip-db');

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  blue:    '\x1b[34m',
  gray:    '\x1b[90m',
};

function print(color, tag, msg) {
  process.stdout.write(`${C.bold}${color}${tag}${C.reset} ${msg}\n`);
}
const info  = (m) => print(C.blue,   '[dev]', m);
const ok    = (m) => print(C.green,  '[dev]', m);
const warn  = (m) => print(C.yellow, '[dev]', m);
const fatal = (m) => { print(C.red, '[dev]', m); process.exit(1); };

// ── Node version check ────────────────────────────────────────────────────────
function checkNode() {
  const major = parseInt(process.versions.node.split('.')[0], 10);
  if (major < 18) {
    fatal(`Node.js 18+ required. You have ${process.versions.node}.\nDownload: https://nodejs.org`);
  }
  ok(`Node.js ${process.versions.node}`);
}

// ── Docker detection ──────────────────────────────────────────────────────────
function detectDocker() {
  // Try modern `docker compose` (Docker Desktop v2+)
  const modern = spawnSync('docker', ['compose', 'version'], {
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
  if (modern.status === 0) return 'modern';

  // Fallback: legacy `docker-compose` (standalone v1)
  const legacy = spawnSync('docker-compose', ['--version'], {
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
  if (legacy.status === 0) return 'legacy';

  return null;
}

function checkDocker() {
  const dockerVer = spawnSync('docker', ['--version'], {
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
  if (dockerVer.status !== 0) {
    warn('Docker not found.');
    warn('Install Docker Desktop: https://www.docker.com/get-started');
    warn('Or start PostgreSQL manually and re-run with: node dev.js --skip-db');
    process.exit(1);
  }

  const mode = detectDocker();
  if (!mode) {
    warn('"docker compose" or "docker-compose" not found. Update Docker Desktop.');
    warn('Or re-run with: node dev.js --skip-db');
    process.exit(1);
  }

  ok(`Docker ready (compose: ${mode === 'modern' ? 'v2 plugin' : 'v1 standalone'})`);
  return mode;
}

// ── .env auto-creation ────────────────────────────────────────────────────────
function ensureEnv(dir) {
  const envPath     = path.join(dir, '.env');
  const examplePath = path.join(dir, '.env.example');
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      ok(`Created ${path.relative(ROOT, envPath)} from .env.example`);
    } else {
      warn(`No .env or .env.example in ${path.relative(ROOT, dir)}`);
    }
  }
}

// ── Load .env into process.env ────────────────────────────────────────────────
function loadEnv(dir) {
  const envPath = path.join(dir, '.env');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (/^["'].*["']$/.test(val)) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  });
}

// ── Dependency auto-install ───────────────────────────────────────────────────
function ensureDependencies() {
  const backendMods  = path.join(BACKEND_DIR, 'node_modules');
  const frontendMods = path.join(FRONTEND_DIR, 'node_modules');
  const needs = [];
  if (!fs.existsSync(backendMods))  needs.push({ label: 'Backend deps',  cwd: BACKEND_DIR });
  if (!fs.existsSync(frontendMods)) needs.push({ label: 'Frontend deps', cwd: FRONTEND_DIR });
  if (needs.length === 0) return;

  info('Installing dependencies (first run — this takes ~1 minute)...');
  for (const { label, cwd } of needs) {
    runSync('npm install', cwd, label);
  }
}

// ── Synchronous runner ────────────────────────────────────────────────────────
function runSync(cmd, cwd, label) {
  info(`${label}...`);
  const res = spawnSync(cmd, {
    cwd,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  if (res.status !== 0) {
    const out = (res.stdout?.toString() || '') + (res.stderr?.toString() || '');
    fatal(`${label} failed:\n${out.slice(0, 2000)}`);
  }
  ok(`${label} ✓`);
}

// ── Prisma client reset (OneDrive CLDFLT bypass) ──────────────────────────────
// Windows' Cloud Files Filter driver (cldflt.sys) blocks atomic renames inside
// OneDrive-managed folders even when OneDrive.exe isn't running. It only blocks
// rename-over-existing-file, not fresh writes. Deleting the generated client
// directory before `prisma generate` forces a clean write every time.
function resetPrismaClient() {
  const clientDir = path.join(BACKEND_DIR, 'node_modules', '.prisma', 'client');
  if (!fs.existsSync(clientDir)) return;
  try {
    fs.rmSync(clientDir, { recursive: true, force: true });
  } catch { /* ignore — generate will overwrite */ }
}

// ── Start database via Docker Compose ─────────────────────────────────────────
function startDatabase(dockerMode) {
  info('Starting PostgreSQL (Docker)...');
  const composeFile = path.join(ROOT, 'docker-compose.dev.yml');

  const cmd = dockerMode === 'modern'
    ? `docker compose -f "${composeFile}" up -d postgres`
    : `docker-compose -f "${composeFile}" up -d postgres`;

  const res = spawnSync(cmd, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: process.env,
  });

  if (res.status !== 0) {
    const out = (res.stdout?.toString() || '') + (res.stderr?.toString() || '');
    fatal(`Failed to start PostgreSQL:\n${out.slice(0, 1000)}`);
  }
  ok('PostgreSQL container started');
}

// ── TCP wait-for-DB ───────────────────────────────────────────────────────────
function waitForDb(host, port, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    info(`Waiting for database at ${host}:${port}...`);

    function attempt() {
      const s = net.createConnection({ host, port });
      s.setTimeout(2000);

      s.on('connect', () => {
        s.destroy();
        ok(`Database ready on port ${port}`);
        resolve();
      });

      const retry = () => {
        s.destroy();
        if (Date.now() >= deadline) {
          reject(new Error(`Database not ready after ${timeoutMs / 1000}s.\nCheck Docker is running: docker ps`));
          return;
        }
        setTimeout(attempt, 1200);
      };

      s.on('error', retry);
      s.on('timeout', retry);
    }

    attempt();
  });
}

// ── Parse DB host/port from DATABASE_URL ──────────────────────────────────────
function parseDbEndpoint() {
  const url = process.env.DATABASE_URL || 'postgresql://localhost:5432/tracker';
  try {
    const parsed = new URL(url);
    return { host: parsed.hostname || 'localhost', port: parseInt(parsed.port, 10) || 5432 };
  } catch {
    return { host: 'localhost', port: 5432 };
  }
}

// ── Async process spawner ─────────────────────────────────────────────────────
const children = [];

function startProcess(label, command, cwd, color) {
  const prefix = `${C.bold}${color}${label}${C.reset}`;
  const child  = spawn(command, { cwd, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });

  children.push(child);

  child.on('error', (err) => process.stderr.write(`${prefix} ERROR: ${err.message}\n`));

  const pipe = (stream) =>
    stream.on('data', (d) =>
      d.toString().split('\n').forEach((line) => {
        if (line.trim()) process.stdout.write(`${prefix} ${line}\n`);
      }),
    );

  pipe(child.stdout);
  pipe(child.stderr);

  child.on('exit', (code, sig) => {
    if (code !== 0 && sig !== 'SIGTERM' && sig !== null) {
      process.stdout.write(`${prefix} process exited (code=${code})\n`);
    }
  });

  return child;
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
function cleanup() {
  children.forEach((p) => { try { p.kill('SIGTERM'); } catch { /* ignore */ } });
  process.exit(0);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  process.stdout.write(
    `\n${C.bold}${C.blue}╔══════════════════════════════════════╗${C.reset}\n` +
    `${C.bold}${C.blue}║   Tracker — one-command dev startup  ║${C.reset}\n` +
    `${C.bold}${C.blue}╚══════════════════════════════════════╝${C.reset}\n\n`,
  );

  checkNode();

  // Docker check (unless --skip-db)
  let dockerMode = null;
  if (!SKIP_DB) {
    dockerMode = checkDocker();
  }

  // Auto-create .env files from examples
  ensureEnv(BACKEND_DIR);
  ensureEnv(FRONTEND_DIR);

  // Load backend .env into process.env so prisma commands work
  loadEnv(BACKEND_DIR);

  // Auto-install node_modules if missing
  ensureDependencies();

  // Start and wait for database
  if (!SKIP_DB && dockerMode) {
    startDatabase(dockerMode);
    const { host, port } = parseDbEndpoint();
    await waitForDb(host, port, 45000);
  } else if (SKIP_DB) {
    info('Skipping Docker DB (--skip-db). Assuming DB is already running.');
  }

  // Prisma: generate client, then sync schema to DB
  // Use "db push" in dev (idempotent, no migration history needed).
  // Production Docker uses "migrate deploy" via the Dockerfile CMD.
  //
  // Delete the generated Prisma client before regenerating so cldflt.sys
  // cannot block the write (it only intercepts rename-over-existing-file).
  resetPrismaClient();
  runSync('npx prisma generate', BACKEND_DIR, 'Prisma generate');
  runSync('npx prisma db push --accept-data-loss', BACKEND_DIR, 'Prisma db push');

  // Seed demo data if requested
  if (SEED) {
    runSync('npx prisma db seed', BACKEND_DIR, 'Seed demo data');
  }

  // Done with setup, launch apps
  process.stdout.write(
    `\n${C.bold}${C.green}Setup complete!${C.reset} Starting development servers...\n\n` +
    `${C.gray}  Frontend → ${C.reset}${C.bold}http://localhost:5173${C.reset}\n` +
    `${C.gray}  Backend  → ${C.reset}${C.bold}http://localhost:3001${C.reset}\n` +
    (SEED
      ? `\n${C.gray}  Demo login:  admin@tracker.dev / Admin1234!${C.reset}\n`
      : '') +
    `\n${C.gray}  Press Ctrl+C to stop all processes${C.reset}\n\n`,
  );

  startProcess('[backend]',  'npm run start:dev', BACKEND_DIR,  C.cyan);
  startProcess('[frontend]', 'npm run dev',       FRONTEND_DIR, C.magenta);

  process.on('SIGINT',  cleanup);
  process.on('SIGTERM', cleanup);
  // Keep process alive
  process.stdin.resume();
}

main().catch((err) => fatal(`Startup failed: ${err.message}`));
