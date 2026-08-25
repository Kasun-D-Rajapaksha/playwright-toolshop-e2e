const fs = require('fs')
const path = require('path')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eq = line.indexOf('=')
    if (eq === -1) continue

    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.join(__dirname, '..', '.env'))

/**
 * Central place for environment-driven configuration. Everything has a
 * sensible default so the suite runs out of the box against the public
 * Toolshop instance, but can be pointed at a local docker-compose stack
 * via environment variables.
 */
const BASE_URL = process.env.TOOLSHOP_BASE_URL || 'https://practicesoftwaretesting.com'
const API_URL = process.env.TOOLSHOP_API_URL || 'https://api.practicesoftwaretesting.com'

// Login account: set TOOLSHOP_CUSTOMER_* in `.env` (gitignored). Falls back
// to the published demo customer when those variables are unset (e.g. CI).
const CUSTOMER = {
  email: process.env.TOOLSHOP_CUSTOMER_EMAIL || 'customer@practicesoftwaretesting.com',
  password: process.env.TOOLSHOP_CUSTOMER_PASSWORD || 'welcome01',
}

// Where the setup project saves the authenticated browser state.
const STORAGE_STATE = path.join(__dirname, '..', 'playwright', '.auth', 'customer.json')

module.exports = { BASE_URL, API_URL, CUSTOMER, STORAGE_STATE }
