const { test, expect } = require('../../lib/fixtures')

test.describe('catalog filtering and pagination', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto()
  })

  test('filters by category and shows exactly the products the API returned @smoke', async ({
    homePage,
  }) => {
    const body = await homePage.filterBy('Pliers')
    const expectedNames = body.data.map((product) => product.name)

    await expect(homePage.productNames).toHaveCount(expectedNames.length)
    expect(await homePage.visibleProductNames()).toEqual(expectedNames)
  })

  test('filters by brand', async ({ homePage }) => {
    const body = await homePage.filterBy('ForgeFlex Tools')
    const expectedNames = body.data.map((product) => product.name)

    expect(expectedNames.length).toBeGreaterThan(0)
    await expect(homePage.productNames).toHaveCount(expectedNames.length)
    expect(await homePage.visibleProductNames()).toEqual(expectedNames)
  })

  test('filters by price range with the slider', async ({ homePage }) => {
    // The slider starts at 1-100; keyboard steps are 1 unit per keypress,
    // so keep the target range close to the defaults.
    const minPrice = 5
    const maxPrice = 75
    const body = await homePage.setPriceRange(minPrice, maxPrice)

    for (const product of body.data) {
      expect(product.price).toBeGreaterThanOrEqual(minPrice)
      expect(product.price).toBeLessThanOrEqual(maxPrice)
    }
    await expect(homePage.productNames).toHaveCount(body.data.length)
  })

  test('paginates through the catalog', async ({ homePage }) => {
    const firstPageNames = await homePage.visibleProductNames()
    expect(firstPageNames).toHaveLength(9)

    const body = await homePage.goToResultsPage(2)
    const secondPageNames = body.data.map((product) => product.name)

    await expect(homePage.productNames.first()).toHaveText(secondPageNames[0])
    expect(secondPageNames).not.toEqual(firstPageNames)
  })

  test('sorts products by price, ascending', async ({ homePage }) => {
    const body = await homePage.sortBy('price,asc')
    const prices = body.data.map((product) => product.price)
    const sorted = [...prices].sort((a, b) => a - b)

    expect(prices).toEqual(sorted)
    await expect(homePage.productPrices.first()).toContainText(sorted[0].toFixed(2))
  })
})
