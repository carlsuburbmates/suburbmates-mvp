type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

function emit(
  level: LogLevel,
  event: string,
  payload: Record<string, unknown> = {}
) {
  const entry = {
    severity: level,
    event,
    ts: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    ...payload,
  }
  const line = JSON.stringify(entry)
  if (level === 'ERROR' || level === 'CRITICAL') {
    console.error(line)
  } else if (level === 'WARNING') {
    console.warn(line)
  } else {
    console.warn(line) // Changed from console.log to console.warn for consistency
  }
}

export const logDebug = (event: string, payload?: Record<string, unknown>) =>
  emit('DEBUG', event, payload)
export const logInfo = (event: string, payload?: Record<string, unknown>) =>
  emit('INFO', event, payload)
export const logWarn = (event: string, payload?: Record<string, unknown>) =>
  emit('WARNING', event, payload)
export const logError = (
  event: string,
  error: unknown,
  payload: Record<string, unknown> = {}
) => {
  const err = error as Error | null
  const errPayload = {
    message: err?.message || String(error),
    stack: err?.stack,
    ...payload,
  }
  emit('ERROR', event, errPayload)
}

export const logCritical = (
  event: string,
  error: unknown,
  payload: Record<string, unknown> = {}
) => {
  const err = error as Error | null
  const errPayload = {
    message: err?.message || String(error),
    stack: err?.stack,
    ...payload,
  }
  emit('CRITICAL', event, errPayload)
}
