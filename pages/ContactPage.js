/** Contact form page. */
class ContactPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.firstName = page.getByTestId('first-name')
    this.lastName = page.getByTestId('last-name')
    this.email = page.getByTestId('email')
    this.subject = page.getByTestId('subject')
    this.message = page.getByTestId('message')
    this.attachment = page.getByTestId('attachment')
    this.submitButton = page.getByTestId('contact-submit')
    this.successAlert = page.getByRole('alert').filter({ hasText: /thanks for your message/i })
  }

  async goto() {
    await this.page.goto('/contact')
  }

  async fillForm({ firstName, lastName, email, subject, message }) {
    if (firstName) await this.firstName.fill(firstName)
    if (lastName) await this.lastName.fill(lastName)
    if (email) await this.email.fill(email)
    if (subject) await this.subject.selectOption({ label: subject })
    if (message) await this.message.fill(message)
  }
}

module.exports = { ContactPage }
