/** The signed-in customer's favorites list at /account/favorites. */
class FavoritesPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    // Each favorite renders as a card with data-test="favorite-<productId>".
    this.items = page.locator('[data-test^="favorite-"]')
  }

  async goto() {
    await this.page.goto('/account/favorites')
  }

  itemByName(name) {
    return this.items.filter({ hasText: name })
  }

  async remove(name) {
    await this.itemByName(name).getByTestId('delete').click()
  }
}

module.exports = { FavoritesPage }
