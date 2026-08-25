const { test, expect, uniqueCustomer } = require('../../lib/fixtures')
const { CUSTOMER } = require('../../lib/env')

test.describe('user auth token lifecycle', () => {
  test('logs in and fetches the profile with the token', async ({ api, customerToken }) => {
    expect(customerToken).toEqual(expect.any(String))

    const response = await api.me(customerToken)
    expect(response.status()).toBe(200)

    const profile = await response.json()
    expect(profile.email).toBe(CUSTOMER.email)
  })

  test('rejects invalid credentials', async ({ api }) => {
    const response = await api.request.post('/users/login', {
      data: { email: CUSTOMER.email, password: 'definitely-wrong' },
    })
    expect(response.status()).toBe(401)
  })

  test('refreshes the access token and the new token is usable', async ({
    api,
    customerToken,
  }) => {
    const refreshResponse = await api.refresh(customerToken)
    expect(refreshResponse.status()).toBe(200)

    const { access_token: refreshedToken } = await refreshResponse.json()
    expect(refreshedToken).toEqual(expect.any(String))

    const meResponse = await api.me(refreshedToken)
    expect(meResponse.status()).toBe(200)
  })

  test('logout invalidates the token', async ({ api, testCustomer }) => {
    // Use a throwaway account so invalidating the token cannot interfere
    // with parallel tests that share the demo customer.
    const token = await api.login(testCustomer)

    const logoutResponse = await api.logout(token)
    expect(logoutResponse.ok()).toBeTruthy()

    const meResponse = await api.me(token)
    expect(meResponse.status()).toBe(401)
  })

  test('registers a new customer via the API and logs in with it', async ({ api }) => {
    const customer = uniqueCustomer()

    const registerResponse = await api.register(customer)
    expect(registerResponse.status()).toBe(201)

    const created = await registerResponse.json()
    expect(created.email).toBe(customer.email)

    const token = await api.login(customer)
    const profile = await (await api.me(token)).json()
    expect(profile.first_name).toBe(customer.first_name)
  })
})
