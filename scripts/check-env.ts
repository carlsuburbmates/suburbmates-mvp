import fs from 'fs';
import path from 'path';

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    env[key] = value;
  }
  return env;
}

function log(msg: string) {
  console.log(`[env:check] ${msg}`);
}

const projectRoot = process.cwd();
const envLocalPath = path.join(projectRoot, '.env.local');
const env = parseEnvFile(envLocalPath);

const requiredKeys = [
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'ABR_GUID',
  'GOOGLE_API_KEY',
];

const optionalKeys = [
  'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
  'FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
];

// One-of requirement: either inline JSON or external credentials path
const oneOfCredentials = ['FIREBASE_SERVICE_ACCOUNT_KEY', 'GOOGLE_APPLICATION_CREDENTIALS'];

let missing: string[] = [];
for (const k of requiredKeys) {
  if (!env[k] || env[k] === '' || env[k] === 'your_abr_guid_here' || env[k].includes('your_')) {
    missing.push(k);
  }
}

const hasInline = !!env['FIREBASE_SERVICE_ACCOUNT_KEY'] && env['FIREBASE_SERVICE_ACCOUNT_KEY'] !== '{}';
const hasPath = !!env['GOOGLE_APPLICATION_CREDENTIALS'];
if (!hasInline && !hasPath) {
  missing.push(`one of ${oneOfCredentials.join(' or ')}`);
}

if (hasPath) {
  const credPath = path.isAbsolute(env['GOOGLE_APPLICATION_CREDENTIALS'])
    ? env['GOOGLE_APPLICATION_CREDENTIALS']
    : path.join(projectRoot, env['GOOGLE_APPLICATION_CREDENTIALS']);
  if (!fs.existsSync(credPath)) {
    log(`WARNING: GOOGLE_APPLICATION_CREDENTIALS points to missing file: ${credPath}`);
  }
}

if (missing.length) {
  console.error('\n[env:check] ERROR: Missing or placeholder keys:');
  for (const k of missing) console.error(` - ${k}`);
  process.exit(1);
}

console.log('[env:check] All required keys are present.');
for (const k of optionalKeys) {
  if (!env[k] || env[k].includes('your_')) {
    log(`Optional key not set: ${k}`);
  }
}
