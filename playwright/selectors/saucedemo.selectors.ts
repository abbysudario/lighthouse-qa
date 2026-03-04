export const selectors = {
  login: {
    username: '[data-test="username"]',
    password: '[data-test="password"]',
    loginButton: '[data-test="login-button"]',
    error: '[data-test="error"]'
  },
  inventory: {
    title: '[data-test="title"]',
    item: '[data-test="inventory-item"]',
    addToCartButtonByName: (name: string) =>
  `[data-test="add-to-cart-${name.toLowerCase().replace(/ /g, '-')}"]`,
    cartLink: '[data-test="shopping-cart-link"]',
    cartBadge: '[data-test="shopping-cart-badge"]',
    sort: '[data-test="product-sort-container"]'
  },
  cart: {
    title: '[data-test="title"]',
    checkout: '[data-test="checkout"]',
    removeByName: (name: string) =>
`[data-test="remove-${name.toLowerCase().replace(/ /g, '-')}"]`
  },
  checkout: {
    firstName: '[data-test="firstName"]',
    lastName: '[data-test="lastName"]',
    postalCode: '[data-test="postalCode"]',
    continue: '[data-test="continue"]',
    finish: '[data-test="finish"]',
    completeHeader: '[data-test="complete-header"]'
  }
} as const;