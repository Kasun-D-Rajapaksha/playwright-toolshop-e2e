# Playwright Toolshop E2E

A portfolio-quality [Playwright](https://playwright.dev) test suite for the
[Practice Software Testing "Toolshop"](https://practicesoftwaretesting.com) demo shop.

It is the Playwright counterpart to my [Cypress Toolshop suite](https://github.com/Kasun-D-Rajapaksha/cypress-toolshop-e2e):
same application under test, but architected around Playwright-native patterns and
covering scenarios the Cypress suite deliberately does not, so the two repos read as
complementary work rather than a port.

## What this suite demonstrates

- **Class-based page objects injected via custom fixtures** — every spec imports
  `{ test, expect }` from `lib/fixtures.js`, where `test.extend` wires up page object
  classes, an API client, and test-data factories. No spec ever constructs a page object
  or logs in by hand unless the login *is* the scenario.
- **One-time authentication with `storageState`** — a `setup` project signs in the
  published demo customer once and saves the browser state. Authenticated specs opt in
  with `test.use({ storageState })` and start already signed in: Playwright's idiomatic
  replacement for `cy.session`.
- **Cross-browser and mobile projects** — Chromium, Firefox and WebKit run the full UI
  suite; a Pixel 7 emulation project runs the `@smoke`-tagged subset as a mobile pass.
- **Browserless API testing with request contexts** — the `api` project exercises the
  backend directly (pagination, sorting, filtering, the auth token lifecycle, invoices)
  with an authenticated-token fixture and zero browser overhead.
- **Web-first assertions, tracing and rich artifacts** — traces, screenshots and videos
  are retained on failure; CI shards the UI run and merges everything into one HTML report.
- **Network fault injection** — `page.route` and `context.setOffline` simulate API
  failures and connectivity loss to verify the SPA degrades gracefully.

## Test coverage

| Area | Spec | Highlights |
| --- | --- | --- |
| Registration | `tests/ui/registration.spec.js` | Full UI form registration + sign-in proof, per-field validation, password policy |
| Checkout | `tests/ui/checkout.spec.js` | Complete purchase journey with mid-checkout sign-in, billing, payment, order confirmation; quantity recalculation |
| Filtering | `tests/ui/filtering.spec.js` | Category/brand filters, price-range slider (keyboard-driven), pagination, sorting — each asserted against the exact API payload the app received |
| Favorites | `tests/ui/favorites.spec.js` | Authenticated add/remove via `storageState`; unauthorized attempt when signed out |
| Contact | `tests/ui/contact.spec.js` | Submission with file attachment, required-field and message-length validation |
| Error handling | `tests/ui/error-handling.spec.js` | Mocked 500s on products and login, offline/recovery mid-session |
| Products API | `tests/api/products.spec.js` | Pagination, sorting, price window, category filter resolved from the category tree, schema contract |
| Auth API | `tests/api/auth.spec.js` | Login, `/users/me`, token refresh, logout invalidation, register-then-login |
| Invoices API | `tests/api/invoices.spec.js` | Auth requirement, paginated shape, clean slate for new customers |

## Project matrix

| Project | What runs | Browser |
| --- | --- | --- |
| `setup` | `tests/setup/auth.setup.js` — saves `storageState` | Chromium |
| `chromium` / `firefox` / `webkit` | All `tests/ui/**` specs | Desktop Chrome / Firefox / Safari |
| `mobile-chrome` | `@smoke`-tagged UI specs only | Pixel 7 emulation |
| `api` | All `tests/api/**` specs | None (request contexts) |

## Getting started

```bash
npm ci
npx playwright install

npm test               # everything: setup + 3 desktop browsers + mobile smoke + api
npm run test:chromium  # UI suite on Chromium only
npm run test:api       # API suite only (no browser)
npm run test:smoke     # @smoke subset on Chromium
npm run report         # open the last HTML report
```

The suite targets the public Toolshop instance by default. Point it elsewhere
(e.g. a local docker-compose stack) with environment variables:

| Variable | Default |
| --- | --- |
| `TOOLSHOP_BASE_URL` | `https://practicesoftwaretesting.com` |
| `TOOLSHOP_API_URL` | `https://api.practicesoftwaretesting.com` |
| `TOOLSHOP_CUSTOMER_EMAIL` | `customer@practicesoftwaretesting.com` |
| `TOOLSHOP_CUSTOMER_PASSWORD` | `welcome01` |

## CI

`.github/workflows/playwright.yml` runs on every push and pull request:

- **UI tests** — Chromium, Firefox, WebKit and the mobile smoke pass, sharded 2 ways.
- **API tests** — the browserless `api` project in a separate quick job.
- **Smoke gate** — pull requests additionally run the `@smoke` subset on Chromium first.
- **Merged report** — every job uploads a blob report; a final job merges them into a
  single HTML report artifact (traces included) via `playwright merge-reports`.

## Design decisions

- **Fixtures over inheritance and globals.** Dependency injection through `test.extend`
  keeps specs declarative and page objects composable; there is no base-class hierarchy
  and no global state.
- **`data-test` as the test ID attribute.** The config sets
  `testIdAttribute: 'data-test'` so `getByTestId` maps directly onto the app's own
  hooks — no brittle CSS/XPath selectors.
- **Assert the UI against the network truth.** Filtering tests capture the JSON the app
  actually received (`waitForResponse`) and assert the rendered grid matches it exactly,
  which catches both rendering and query-parameter bugs without hard-coding catalog data.
- **Parallel-safe test data.** Registration uses a unique-customer factory; favorites
  picks a different product per browser project so parallel runs against the shared demo
  account never race; logout tests use throwaway accounts so they cannot invalidate a
  token another worker is using.
- **The demo database resets periodically.** Tests create whatever state they need and
  never depend on leftovers from previous runs.

## Credits

[Practice Software Testing](https://github.com/testsmith-io/practice-software-testing)
by Testsmith is the application under test — an excellent playground for test automation.
