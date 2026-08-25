/** Product catalog / landing page, including the filter sidebar. */
class HomePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page

    // Header / navigation
    this.signInLink = page.getByTestId('nav-sign-in')
    this.navMenu = page.getByTestId('nav-menu')
    this.cartLink = page.getByTestId('nav-cart')
    this.cartQuantity = page.getByTestId('cart-quantity')

    // Search and sorting
    this.searchInput = page.getByTestId('search-query')
    this.searchSubmit = page.getByTestId('search-submit')
    this.sortSelect = page.getByTestId('sort')

    // Product grid
    this.productCards = page.locator('a.card')
    this.productNames = page.getByTestId('product-name')
    this.productPrices = page.getByTestId('product-price')

    // Filters and pagination
    this.filterSection = page.locator('#filters')
    this.pagination = page.locator('ul.pagination')
  }

  async goto() {
    await this.page.goto('/')
    await this.productCards.first().waitFor()
  }

  async search(query) {
    await this.searchInput.fill(query)
    await this.searchSubmit.click()
  }

  async sortBy(value) {
    const responsePromise = this.waitForProducts((query) => query.sort === value)
    await this.sortSelect.selectOption(value)
    return responsePromise
  }

  /**
   * Checks a category or brand checkbox by its visible label and returns
   * the parsed JSON of the resulting products request, so tests can assert
   * the UI against the exact payload the app received.
   */
  async filterBy(label) {
    const responsePromise = this.waitForProducts(
      (query) => 'by_category' in query || 'by_brand' in query,
    )
    await this.page.getByLabel(label, { exact: true }).check()
    return responsePromise
  }

  /**
   * Drags both ngx-slider pointers to the given values via the keyboard and
   * waits for the products response for that exact price window (every
   * keystroke fires an intermediate request).
   */
  async setPriceRange(min, max) {
    const responsePromise = this.waitForProducts(
      (query) => query.between === `price,${min},${max}`,
    )
    await this.moveSliderPointer(this.page.locator('.ngx-slider-pointer-min'), min)
    await this.moveSliderPointer(this.page.locator('.ngx-slider-pointer-max'), max)
    return responsePromise
  }

  async moveSliderPointer(pointer, target) {
    await pointer.click()
    // Keyboard steps are 1 unit; guard against an unreachable target.
    for (let step = 0; step < 250; step++) {
      const current = Number(await pointer.getAttribute('aria-valuenow'))
      if (current === target) return
      await pointer.press(current < target ? 'ArrowRight' : 'ArrowLeft')
    }
    throw new Error(`Slider pointer never reached ${target}`)
  }

  async goToResultsPage(number) {
    const responsePromise = this.waitForProducts(
      (query) => String(query.page) === String(number),
    )
    await this.pagination.getByText(String(number), { exact: true }).click()
    return responsePromise
  }

  async openProduct(name) {
    await this.productNames.filter({ hasText: name }).first().click()
  }

  /**
   * Waits for the next products API response whose request body matches the
   * predicate. The app sends catalog queries as HTTP QUERY requests with a
   * JSON body ({ page, sort, between, by_category, by_brand, ... }).
   */
  async waitForProducts(queryPredicate) {
    const response = await this.page.waitForResponse((response) => {
      if (!response.url().includes('/products')) return false
      let query
      try {
        query = response.request().postDataJSON() ?? {}
      } catch {
        query = {}
      }
      return queryPredicate(query)
    })
    return response.json()
  }

  async visibleProductNames() {
    const names = await this.productNames.allInnerTexts()
    return names.map((name) => name.trim())
  }
}

module.exports = { HomePage }
