export const selectors = {
  login: {
    username: '[data-test="username"]',
    password: '[data-test="password"]',
    loginButton: '[data-test="login-button"]',
    error: '[data-test="error"]'
  },
  inventory: {
    title: '.title',
    item: '.inventory_item',
    addToCartButtonByName: (name: string) =>
      `xpath=//div[contains(@class,"inventory_item")]//div[@class="inventory_item_name" and text()="${name}"]/ancestor::div[contains(@class,"inventory_item")]//button`,
    cartLink: '.shopping_cart_link',
    cartBadge: '.shopping_cart_badge',
    sort: '[data-test="product_sort_container"]'
  },
  cart: {
    title: '.title',
    checkout: '[data-test="checkout"]',
    removeByName: (name: string) =>
      `xpath=//div[@class="cart_item"]//div[@class="inventory_item_name" and text()="${name}"]/ancestor::div[@class="cart_item"]//button`
  },
  checkout: {
    firstName: '[data-test="firstName"]',
    lastName: '[data-test="lastName"]',
    postalCode: '[data-test="postalCode"]',
    continue: '[data-test="continue"]',
    finish: '[data-test="finish"]',
    completeHeader: '.complete-header'
  }
} as const;