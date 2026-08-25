const { test, expect } = require('../../lib/fixtures')

// The journey deliberately starts signed out: signing in mid-checkout is
// part of the scenario under test.
test.use({ storageState: { cookies: [], origins: [] } })

const PRODUCT_NAME = 'Combination Pliers'

test.describe('checkout journey', () => {
  test('completes a full purchase: cart, sign in, billing, payment @smoke', async ({
    homePage,
    productPage,
    checkoutPage,
    page,
    testCustomer,
  }) => {
    // The public postcode-lookup endpoint returns random faker addresses.
    // POST /invoices then geo-validates city against the ISO country code,
    // so an AT lookup that yields "New Arianna, Missouri" 422s. Pin a
    // payload the live invoice API has been verified to accept.
    await page.route('**/postcode-lookup*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          street: 'Marvin-Krenn-Gasse',
          house_number: '1',
          city: 'Mittersill',
          state: 'Vorarlberg',
          country: 'AT',
          postcode: '1010',
        }),
      }),
    )
    // Add a product to the cart from its detail page.
    await homePage.goto()
    await homePage.openProduct(PRODUCT_NAME)
    await expect(productPage.name).toHaveText(PRODUCT_NAME)
    await productPage.addToCart()
    await expect(productPage.toast).toContainText(/shopping cart/i)
    await expect(homePage.cartQuantity).toHaveText('1')

    // Step 1 – cart.
    await homePage.cartLink.click()
    await expect(checkoutPage.productTitles.first()).toContainText(PRODUCT_NAME)
    await expect(checkoutPage.cartTotal).toBeVisible()
    await checkoutPage.proceedToSignIn.click()

    // Step 2 – sign in mid-checkout with a throwaway customer so the
    // shared demo account's incomplete address cannot 422 the invoice.
    await checkoutPage.signIn(testCustomer)
    await expect(checkoutPage.proceedToBilling).toBeEnabled()
    await checkoutPage.proceedToBilling.click()

    // Step 3 – country + postcode lookup (street/city come from the API).
    await checkoutPage.completeBillingAddress(testCustomer.address)
    await expect(checkoutPage.proceedToPayment).toBeEnabled()
    await checkoutPage.proceedToPayment.click()

    // Step 4 – payment and confirmation.
    await checkoutPage.paymentMethod.selectOption('cash-on-delivery')
    await checkoutPage.confirmPayment()
    await expect(checkoutPage.paymentSuccessMessage).toContainText(/payment was successful/i)

    await checkoutPage.confirmOrder()
    await expect(checkoutPage.orderConfirmation).toBeVisible()
    await expect(page.getByText(/invoice number/i)).toBeVisible()
  })

  test('recalculates the line price when the quantity changes', async ({
    homePage,
    productPage,
    checkoutPage,
  }) => {
    await homePage.goto()
    await homePage.openProduct(PRODUCT_NAME)
    const unitPrice = parseFloat((await productPage.unitPrice.innerText()).replace(/[^\d.]/g, ''))
    await productPage.addToCart()
    await expect(homePage.cartQuantity).toHaveText('1')

    await homePage.cartLink.click()
    await checkoutPage.productQuantities.first().fill('3')
    await checkoutPage.productQuantities.first().press('Enter')

    const expectedTotal = (unitPrice * 3).toFixed(2)
    await expect(checkoutPage.linePrices.first()).toContainText(expectedTotal)
  })
})
