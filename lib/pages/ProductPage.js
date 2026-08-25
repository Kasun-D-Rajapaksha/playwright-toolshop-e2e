/** Product detail page. */
class ProductPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.name = page.getByTestId('product-name')
    this.unitPrice = page.getByTestId('unit-price')
    this.quantity = page.getByTestId('quantity')
    this.increaseQuantity = page.getByTestId('increase-quantity')
    this.decreaseQuantity = page.getByTestId('decrease-quantity')
    this.addToCartButton = page.getByTestId('add-to-cart')
    this.addToFavoritesButton = page.getByTestId('add-to-favorites')
    this.toast = page.getByRole('alert')
  }

  async addToCart() {
    await this.addToCartButton.click()
  }

  async addToFavorites() {
    await this.addToFavoritesButton.click()
  }
}

module.exports = { ProductPage }
