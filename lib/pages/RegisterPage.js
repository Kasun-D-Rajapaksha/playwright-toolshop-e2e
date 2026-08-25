/** Customer registration page. */
class RegisterPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.firstName = page.getByTestId('first-name')
    this.lastName = page.getByTestId('last-name')
    this.dob = page.getByTestId('dob')
    this.street = page.getByTestId('street')
    this.postalCode = page.getByTestId('postal_code')
    this.houseNumber = page.getByTestId('house_number')
    this.city = page.getByTestId('city')
    this.state = page.getByTestId('state')
    this.country = page.getByTestId('country')
    this.phone = page.getByTestId('phone')
    this.email = page.getByTestId('email')
    this.password = page.getByTestId('password')
    this.submitButton = page.getByTestId('register-submit')
  }

  async goto() {
    await this.page.goto('/auth/register')
  }

  /** Fills the whole form from a uniqueCustomer()-shaped payload. */
  async register(customer) {
    await this.firstName.fill(customer.first_name)
    await this.lastName.fill(customer.last_name)
    await this.dob.fill(customer.dob)
    await this.country.selectOption({ label: customer.address.country })
    await this.postalCode.fill(customer.address.postal_code)
    await this.houseNumber.fill(customer.address.house_number)
    await this.street.fill(customer.address.street)
    await this.city.fill(customer.address.city)
    await this.state.fill(customer.address.state)
    await this.phone.fill(customer.phone)
    await this.email.fill(customer.email)
    await this.password.fill(customer.password)
    await this.submitButton.click()
  }
}

module.exports = { RegisterPage }
