const ts = (): string => new Date().toISOString();

export interface Logger {
  info: (msg: string, meta?: unknown) => void;
  warn: (msg: string, meta?: unknown) => void;
  error: (msg: string, meta?: unknown) => void;
}

export const logger: Logger = {
  info: (msg, meta) => console.log(`[${ts()}] INFO  ${msg}`, meta ?? ''),
  warn: (msg, meta) => console.warn(`[${ts()}] WARN  ${msg}`, meta ?? ''),
  error: (msg, meta) => console.error(`[${ts()}] ERROR ${msg}`, meta ?? ''),
};
