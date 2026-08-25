/** Sign-in page. */
class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.emailInput = page.getByTestId('email')
    this.passwordInput = page.getByTestId('password')
    this.submitButton = page.getByTestId('login-submit')
    this.loginError = page.getByTestId('login-error')
    this.emailError = page.getByTestId('email-error')
    this.passwordError = page.getByTestId('password-error')
  }

  async goto() {
    await this.page.goto('/auth/login')
  }

  async login(email, password) {
    if (email) await this.emailInput.fill(email)
    if (password) await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}

module.exports = { LoginPage }
