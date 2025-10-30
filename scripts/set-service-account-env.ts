import fs from 'node:fs'
import path from 'node:path'

const ENV_LOCAL = path.join(process.cwd(), '.env.local')

function getServiceAccountPath(envContent: string): string | null {
  const match = envContent.match(/^SERVICE_ACCOUNT_KEY_PATH=(.*)$/m)
  if (!match) return null
  let p = match[1].trim()
  // Strip quotes if present
  if (
    (p.startsWith('"') && p.endsWith('"')) ||
    (p.startsWith("'") && p.endsWith("'"))
  ) {
    p = p.slice(1, -1)
  }
  return p
}

function upsertEnvLine(env: string, key: string, value: string): string {
  const re = new RegExp(`^${key}=.*$`, 'm')
  const line = `${key}=${value}`
  if (re.test(env)) {
    return env.replace(re, line)
  }
  // Ensure trailing newline
  if (!env.endsWith('\n')) env += '\n'
  return env + line + '\n'
}

function main() {
  if (!fs.existsSync(ENV_LOCAL)) {
    console.error('.env.local not found')
    process.exit(1)
  }
  const envContent = fs.readFileSync(ENV_LOCAL, 'utf8')
  const saPath = getServiceAccountPath(envContent)
  if (!saPath) {
    console.error('SERVICE_ACCOUNT_KEY_PATH not found in .env.local')
    process.exit(1)
  }
  if (!fs.existsSync(saPath)) {
    console.error(`Service account JSON not found at: ${saPath}`)
    process.exit(1)
  }
  const jsonRaw = fs.readFileSync(saPath, 'utf8')
  let oneLine: string
  try {
    const obj = JSON.parse(jsonRaw)
    oneLine = JSON.stringify(obj)
  } catch (e) {
    console.error('Failed to parse service account JSON:', (e as Error).message)
    process.exit(1)
  }

  const updated = upsertEnvLine(
    envContent,
    'FIREBASE_SERVICE_ACCOUNT_KEY',
    oneLine
  )
  fs.writeFileSync(ENV_LOCAL, updated)
  console.log('FIREBASE_SERVICE_ACCOUNT_KEY set in .env.local')
}

main()
