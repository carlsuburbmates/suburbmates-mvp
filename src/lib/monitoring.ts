type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

function emit(level: LogLevel, event: string, payload: Record<string, any> = {}) {
  const entry = {
    severity: level,
    event,
    ts: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    ...payload,
  };
  const line = JSON.stringify(entry);
  if (level === 'ERROR' || level === 'CRITICAL') {
    console.error(line);
  } else if (level === 'WARNING') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logDebug = (event: string, payload?: Record<string, any>) => emit('DEBUG', event, payload);
export const logInfo = (event: string, payload?: Record<string, any>) => emit('INFO', event, payload);
export const logWarn = (event: string, payload?: Record<string, any>) => emit('WARNING', event, payload);
export const logError = (event: string, error: any, payload: Record<string, any> = {}) => {
  const errPayload = {
    message: error?.message || String(error),
    stack: error?.stack,
    ...payload,
  };
  emit('ERROR', event, errPayload);
};