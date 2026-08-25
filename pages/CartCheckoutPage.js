/**
 * The four-step checkout wizard at /checkout:
 * cart -> sign in -> billing address -> payment & confirmation.
 */
const { expect } = require('@playwright/test')

class CartCheckoutPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page

    // Step 1 – cart
    this.productTitles = page.getByTestId('product-title')
    this.productQuantities = page.getByTestId('product-quantity')
    this.linePrices = page.getByTestId('line-price')
    this.cartTotal = page.getByTestId('cart-total')
    this.proceedToSignIn = page.getByTestId('proceed-1')

    // Step 2 – sign in
    this.emailInput = page.getByTestId('email')
    this.passwordInput = page.getByTestId('password')
    this.loginSubmit = page.getByTestId('login-submit')
    this.proceedToBilling = page.getByTestId('proceed-2')

    // Step 3 – billing address (country is a <select>, the rest are inputs)
    this.country = page.getByTestId('country')
    this.postalCode = page.getByTestId('postal_code')
    this.houseNumber = page.getByTestId('house_number')
    this.street = page.getByTestId('street')
    this.city = page.getByTestId('city')
    this.state = page.getByTestId('state')
    this.proceedToPayment = page.getByTestId('proceed-3')

    // Step 4 – payment
    this.paymentMethod = page.getByTestId('payment-method')
    this.confirmButton = page.getByTestId('finish')
    this.paymentSuccessMessage = page.getByTestId('payment-success-message')
    this.orderConfirmation = page.getByText(/thanks for your order/i)
    this.postcodeLookupLoading = page.getByTestId('postcode-lookup-loading')
    this.postcodeLookupError = page.getByTestId('postcode-lookup-error')
  }

  async goto() {
    await this.page.goto('/checkout')
  }

  async signIn({ email, password }) {
    const profileLoaded = this.page.waitForResponse(
      (response) => response.url().includes('/users/me') && response.ok(),
    )
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginSubmit.click()
    await profileLoaded
  }

  /**
   * Sets country, postcode and house number, then waits for the Toolshop
   * postcode lookup to fill street/city/state. POST /invoices geo-validates
   * that trio against the selected country *code* (AT, not "Austria").
   */
  async completeBillingAddress(address) {
    this.countryLabel = address.country
    await this.country.waitFor()
    await this.country.selectOption({ label: address.country })
    await this.postalCode.fill(address.postal_code)

    const lookup = this.page.waitForResponse((response) => {
      const url = response.url()
      return (
        url.includes('/postcode-lookup') &&
        url.includes(`house_number=${encodeURIComponent(address.house_number)}`) &&
        url.includes(`postcode=${encodeURIComponent(address.postal_code)}`) &&
        response.ok()
      )
    })
    // Clear first so Angular valueChanges fires even when the profile
    // already had the same house number.
    await this.houseNumber.fill('')
    await this.houseNumber.fill(address.house_number)
    const resolved = await (await lookup).json()

    await expect(this.postcodeLookupError).toHaveCount(0)
    await expect(this.street).toHaveValue(resolved.street)
    await expect(this.city).toHaveValue(resolved.city)
    await expect(this.state).toHaveValue(resolved.state)
    // A late /users/me patch writes the country *name*; the invoice API
    // requires the ISO code from the <select> value.
    await this.ensureIsoCountry(address.country)
  }

  async ensureIsoCountry(label) {
    const current = await this.country.inputValue()
    if (/^[A-Z]{2}$/.test(current)) return
    await this.country.selectOption({ label }, { force: true })
    await expect(this.country).toHaveValue(/^[A-Z]{2}$/)
  }

  async confirmPayment() {
    await this.confirmButton.click()
    await this.paymentSuccessMessage.waitFor()
  }

  async confirmOrder() {
    if (this.countryLabel) {
      await this.ensureIsoCountry(this.countryLabel)
    }

    const invoiceCreated = this.page.waitForResponse(
      (response) =>
        response.url().includes('/invoices') && response.request().method() === 'POST',
    )
    await this.confirmButton.click()
    const response = await invoiceCreated
    if (!response.ok()) {
      throw new Error(
        `Invoice create failed: HTTP ${response.status()} ${await response.text()} payload=${response.request().postData()}`,
      )
    }
  }
}

module.exports = { CartCheckoutPage }
