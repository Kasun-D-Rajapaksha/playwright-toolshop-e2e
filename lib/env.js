const path = require('path')

/**
 * Central place for environment-driven configuration. Everything has a
 * sensible default so the suite runs out of the box against the public
 * Toolshop instance, but can be pointed at a local docker-compose stack
 * via environment variables.
 */
const BASE_URL = process.env.TOOLSHOP_BASE_URL || 'https://practicesoftwaretesting.com'
const API_URL = process.env.TOOLSHOP_API_URL || 'https://api.practicesoftwaretesting.com'

// Published demo account seeded by the application itself.
// See https://github.com/testsmith-io/practice-software-testing
const CUSTOMER = {
  email: process.env.TOOLSHOP_CUSTOMER_EMAIL || 'customer@practicesoftwaretesting.com',
  password: process.env.TOOLSHOP_CUSTOMER_PASSWORD || 'welcome01',
}

// Where the setup project saves the authenticated browser state.
const STORAGE_STATE = path.join(__dirname, '..', 'playwright', '.auth', 'customer.json')

module.exports = { BASE_URL, API_URL, CUSTOMER, STORAGE_STATE }
