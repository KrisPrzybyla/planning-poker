import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
const LOG_TO_CONSOLE = (process.env.LOG_TO_CONSOLE ?? 'true') === 'true';

function ensureDirSync(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {}
}

ensureDirSync(LOG_DIR);

const appLogPath = path.join(LOG_DIR, 'app.log');
const errLogPath = path.join(LOG_DIR, 'error.log');

const appStream = fs.createWriteStream(appLogPath, { flags: 'a' });
const errStream = fs.createWriteStream(errLogPath, { flags: 'a' });

const levels = { error: 0, warn: 1, info: 2, debug: 3 };

function serializeMeta(meta) {
  if (!meta) return '';
  try {
    return ' ' + JSON.stringify(meta);
  } catch {
    return ' ' + String(meta);
  }
}

function write(stream, line) {
  try {
    stream.write(line + '\n');
  } catch {}
}

function log(level, message, meta) {
  const ts = new Date().toISOString();
  const line = `${ts} ${level.toUpperCase()} ${message}${serializeMeta(meta)}`;
  // stdout/stderr
  if (level === 'error') {
    if (LOG_TO_CONSOLE) console.error(line);
    write(errStream, line);
  } else if (level === 'warn') {
    if (LOG_TO_CONSOLE) console.warn(line);
    write(appStream, line);
  } else {
    if (LOG_TO_CONSOLE) console.log(line);
    write(appStream, line);
  }
}

function shouldLog(level) {
  return levels[level] <= levels[LOG_LEVEL];
}

export const logger = {
  error: (msg, meta) => { if (shouldLog('error')) log('error', msg, meta); },
  warn:  (msg, meta) => { if (shouldLog('warn'))  log('warn',  msg, meta); },
  info:  (msg, meta) => { if (shouldLog('info'))  log('info',  msg, meta); },
  debug: (msg, meta) => { if (shouldLog('debug')) log('debug', msg, meta); },
};

// Global handlers to catch unexpected crashes
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { message: err?.message, stack: err?.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', { reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason });
});
