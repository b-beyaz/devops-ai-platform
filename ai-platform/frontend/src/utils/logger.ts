type Level = 'info' | 'warn' | 'error' | 'debug' | 'system';

const COLORS: Record<Level, string> = {
  system: 'color:#a78bfa;font-weight:bold',
  info:   'color:#34d399;font-weight:bold',
  warn:   'color:#fbbf24;font-weight:bold',
  error:  'color:#f87171;font-weight:bold',
  debug:  'color:#60a5fa;font-weight:bold',
};

function log(level: Level, module: string, message: string, data?: unknown) {
  const ts = new Date().toLocaleTimeString('tr-TR');
  const prefix = `%c[${ts}] [${level.toUpperCase()}] [${module}]`;
  if (data !== undefined) {
    console.log(prefix, COLORS[level], message, data);
  } else {
    console.log(prefix, COLORS[level], message);
  }
}

export const logger = {
  system: (mod: string, msg: string, data?: unknown) => log('system', mod, msg, data),
  info:   (mod: string, msg: string, data?: unknown) => log('info',   mod, msg, data),
  warn:   (mod: string, msg: string, data?: unknown) => log('warn',   mod, msg, data),
  error:  (mod: string, msg: string, data?: unknown) => log('error',  mod, msg, data),
  debug:  (mod: string, msg: string, data?: unknown) => log('debug',  mod, msg, data),
};
