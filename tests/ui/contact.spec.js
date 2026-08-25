const path = require('path')
const { test, expect } = require('../../fixtures')

test.use({ storageState: { cookies: [], origins: [] } })

// The Toolshop contact endpoint only accepts empty .txt attachments,
// which makes it a handy fixture for exercising the upload path.
const EMPTY_ATTACHMENT = path.join(__dirname, '../../test-data/empty-attachment.txt')

const VALID_MESSAGE =
  'This is an automated end-to-end test message. It is intentionally long enough to satisfy the fifty character minimum length rule of the form.'

test.describe('contact form', () => {
  test.beforeEach(async ({ contactPage }) => {
    await contactPage.goto()
  })

  test('submits a message with a file attachment', async ({ contactPage }) => {
    await contactPage.fillForm({
      firstName: 'Playwright',
      lastName: 'Tester',
      email: 'playwright.tester@example.com',
      subject: 'Webmaster',
      message: VALID_MESSAGE,
    })
    await contactPage.attachment.setInputFiles(EMPTY_ATTACHMENT)
    await contactPage.submitButton.click()

    await expect(contactPage.successAlert).toBeVisible()
  })

  test('requires all mandatory fields', async ({ contactPage }) => {
    await contactPage.submitButton.click()

    await expect(contactPage.page.getByTestId('first-name-error')).toBeVisible()
    await expect(contactPage.page.getByTestId('last-name-error')).toBeVisible()
    await expect(contactPage.page.getByTestId('email-error')).toBeVisible()
    await expect(contactPage.page.getByTestId('subject-error')).toBeVisible()
    await expect(contactPage.page.getByTestId('message-error')).toBeVisible()
  })

  test('rejects a message shorter than fifty characters', async ({ contactPage }) => {
    await contactPage.fillForm({
      firstName: 'Playwright',
      lastName: 'Tester',
      email: 'playwright.tester@example.com',
      subject: 'Webmaster',
      message: 'Too short.',
    })
    await contactPage.submitButton.click()

    await expect(contactPage.page.getByTestId('message-error')).toContainText(/50/)
  })
})
