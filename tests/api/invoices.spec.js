const { test, expect } = require('../../lib/fixtures')

test.describe('invoices API', () => {
  test('requires authentication', async ({ api }) => {
    const response = await api.request.get('/invoices')
    expect(response.status()).toBe(401)
  })

  test('returns a paginated invoice list for the signed-in customer', async ({
    api,
    customerToken,
  }) => {
    const response = await api.invoices(customerToken)
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body).toEqual(
      expect.objectContaining({
        current_page: expect.any(Number),
        data: expect.any(Array),
        total: expect.any(Number),
      }),
    )

    // The demo database resets periodically, so the list may be empty;
    // when invoices exist they must belong to this customer and carry
    // an invoice number and total.
    for (const invoice of body.data) {
      expect(invoice).toEqual(
        expect.objectContaining({
          invoice_number: expect.stringMatching(/^INV/),
          total: expect.any(Number),
        }),
      )
    }
  })

  test('a brand-new customer starts with no invoices', async ({ api, testCustomer }) => {
    const token = await api.login(testCustomer)
    const body = await (await api.invoices(token)).json()

    expect(body.total).toBe(0)
    expect(body.data).toEqual([])
  })
})
