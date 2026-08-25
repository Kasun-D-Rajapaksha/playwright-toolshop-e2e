const { test, expect } = require('../../fixtures')

// These specs run in the browserless `api` project; `api` wraps a request
// context pointed at https://api.practicesoftwaretesting.com.
test.describe('products API', () => {
  test('paginates with nine products per page', async ({ api }) => {
    const firstPage = await (await api.products({ page: 1 })).json()
    const secondPage = await (await api.products({ page: 2 })).json()

    expect(firstPage.per_page).toBe(9)
    expect(firstPage.data).toHaveLength(9)
    expect(firstPage.current_page).toBe(1)
    expect(secondPage.current_page).toBe(2)

    const firstIds = firstPage.data.map((product) => product.id)
    const secondIds = secondPage.data.map((product) => product.id)
    expect(firstIds).not.toEqual(expect.arrayContaining(secondIds))
  })

  test('sorts by price in both directions', async ({ api }) => {
    const ascending = await (await api.products({ sort: 'price,asc' })).json()
    const descending = await (await api.products({ sort: 'price,desc' })).json()

    const ascPrices = ascending.data.map((product) => product.price)
    const descPrices = descending.data.map((product) => product.price)

    expect(ascPrices).toEqual([...ascPrices].sort((a, b) => a - b))
    expect(descPrices).toEqual([...descPrices].sort((a, b) => b - a))
  })

  test('filters by a price window', async ({ api }) => {
    const response = await api.products({ between: 'price,10,50' })
    expect(response.ok()).toBeTruthy()

    const body = await response.json()
    expect(body.data.length).toBeGreaterThan(0)
    for (const product of body.data) {
      expect(product.price).toBeGreaterThanOrEqual(10)
      expect(product.price).toBeLessThanOrEqual(50)
    }
  })

  test('filters by category resolved from the category tree', async ({ api }) => {
    const tree = await (await api.categoriesTree()).json()
    const handTools = tree.find((category) => category.slug === 'hand-tools')
    expect(handTools).toBeDefined()

    const pliers = handTools.sub_categories.find((sub) => sub.slug === 'pliers')
    expect(pliers).toBeDefined()

    const body = await (await api.products({ by_category: pliers.id })).json()
    expect(body.data.length).toBeGreaterThan(0)
    for (const product of body.data) {
      expect(product.category.id).toBe(pliers.id)
    }
  })

  test('returns the expected product schema', async ({ api }) => {
    const body = await (await api.products()).json()
    const product = body.data[0]

    expect(product).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        price: expect.any(Number),
        in_stock: expect.any(Boolean),
        category: expect.objectContaining({ id: expect.any(String) }),
        brand: expect.objectContaining({ id: expect.any(String) }),
      }),
    )
  })
})
