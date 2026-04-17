# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a fully client-side expense tracker delivered as three files (`index.html`, `style.css`, `script.js`) plus a shared pure-logic module (`logic.js`) and a property-based test script (`tests/properties.js`). No build step, no framework — plain HTML, CSS, and vanilla JavaScript with Chart.js from CDN.

The implementation follows a bottom-up order: scaffold → state & storage → core logic (extracted to `logic.js`) → UI components → integration via `render()` → error handling → responsive CSS → property tests.

## Tasks

- [x] 1. Scaffold the project files and load external dependencies
  - Create `index.html` with `<!DOCTYPE html>`, `<meta name="viewport">`, Google Font `<link>` (e.g. Nunito from fonts.googleapis.com), Chart.js CDN `<script>` (pinned version), and `<script src="script.js" defer>` and `<link rel="stylesheet" href="style.css">`
  - Add semantic landmark elements: `<header>`, `<main>`, `<section>` placeholders for each UI region (form, list, chart, category manager, monthly summary) with `id` attributes matching the design
  - Create `style.css` with CSS custom properties for the pastel palette (`--color-pink`, `--color-peach`, etc. matching `CHART_COLORS`), a CSS reset, and base typography using the loaded Google Font
  - Create `script.js` with a top-level `'use strict'` declaration and a `DOMContentLoaded` entry point comment block
  - Create `logic.js` as an empty module placeholder (will hold pure functions extracted in task 3)
  - _Requirements: 9.2, 9.3_

- [x] 2. Define app constants and in-memory state
  - In `script.js`, declare `BUILT_IN_CATEGORIES`, `CHART_COLORS`, and storage key constants (`STORAGE_KEY_TX`, `STORAGE_KEY_CATS`)
  - Declare mutable state variables: `let transactions = []`, `let customCategories = []`, `let activeSort = 'default'`, `let activeMonth = null`, `let chartInstance = null`
  - Add a comment block explaining each variable's role and expected type
  - _Requirements: 1.2, 4.1, 8.1_

- [ ] 3. Implement pure logic functions in `logic.js`
  - [x] 3.1 Implement `validateTransaction(name, amount)` — returns `{ valid: boolean, errors: { name?, amount? } }`; rejects whitespace-only names and non-positive amounts
    - _Requirements: 1.5, 1.6_
  - [x] 3.2 Implement `calculateBalance(transactions)` — returns the arithmetic sum of `amount` fields as a number
    - _Requirements: 3.1, 3.4_
  - [x] 3.3 Implement `formatCurrency(amount)` — formats using `toLocaleString('en-US', { style: 'currency', currency: 'IDR' })` and returns a string with exactly two decimal places
    - _Requirements: 3.4_
  - [x] 3.4 Implement `aggregateByCategory(transactions)` — returns an object/Map of `{ category: totalAmount }` for all distinct categories present
    - _Requirements: 4.1_
  - [x] 3.5 Implement `filterByMonth(transactions, monthString)` — returns transactions whose `date` ISO string starts with the `"YYYY-MM"` prefix; returns all transactions when `monthString` is `null`
    - _Requirements: 6.2, 6.5_
  - [x] 3.6 Implement `sortTransactions(transactions, sortKey)` — returns a new sorted array (non-mutating) for keys `default` (most-recent-first by date), `amount-asc`, `amount-desc`, `category-az`, `category-za`
    - _Requirements: 7.2, 7.3, 7.4_
  - [x] 3.7 Implement `validateCategory(name, existingCategories)` — returns `{ valid: boolean, error? }`; rejects empty/whitespace names and case-insensitive duplicates
    - _Requirements: 5.4, 5.5_
  - [x] 3.8 Implement `serializeTransactions(transactions)` / `deserializeTransactions(json)` — wrap `JSON.stringify` / `JSON.parse` with try/catch; `deserializeTransactions` returns `[]` on parse failure and logs a console warning
    - _Requirements: 8.1, 8.3_
  - [x] 3.9 Implement `serializeCategories(categories)` / `deserializeCategories(json)` — same pattern as 3.8 for the custom categories array
    - _Requirements: 8.2, 8.4_

- [x] 4. Implement storage helpers in `script.js`
  - Write `saveTransactions()` — calls `localStorage.setItem(STORAGE_KEY_TX, serializeTransactions(transactions))` wrapped in try/catch; on `QuotaExceededError` or any error, calls `showToast()` (stubbed for now)
  - Write `saveCategories()` — same pattern for `STORAGE_KEY_CATS` / `customCategories`
  - Write `loadTransactions()` — reads from `localStorage.getItem(STORAGE_KEY_TX)` and returns `deserializeTransactions(raw)`
  - Write `loadCategories()` — reads from `localStorage.getItem(STORAGE_KEY_CATS)` and returns `deserializeCategories(raw)`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 5. Checkpoint — Verify logic module and storage helpers
  - Ensure all functions in `logic.js` are exported (or reachable by `tests/properties.js`)
  - Manually call `saveTransactions()` and `loadTransactions()` in the browser console to confirm round-trip works before building UI
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Build the HTML structure for all UI components
  - Add the Input Form section: `<form id="transaction-form">` containing `<input id="item-name">`, `<input id="amount" type="number" min="0.01" step="0.01">`, `<select id="category">`, `<button type="submit">Add Transaction</button>`, and inline `<span class="error" id="name-error">` / `<span class="error" id="amount-error">` elements
  - Add the Balance Display section: `<div id="balance-display">` with `<span id="total-amount">`
  - Add the Monthly Summary section: `<input id="month-filter" type="month">` and `<button id="clear-month-btn">Clear</button>`
  - Add the Sort Control: `<select id="sort-select">` with `<option>` values `default`, `amount-asc`, `amount-desc`, `category-az`, `category-za`
  - Add the Transaction List: `<ul id="transaction-list">`
  - Add the Chart section: `<canvas id="spending-chart">` and `<p id="chart-empty-msg">No transactions yet.</p>`
  - Add the Category Manager section: `<input id="new-category">`, `<button id="add-category-btn">Add Category</button>`, `<span class="error" id="category-error">`
  - _Requirements: 1.1, 2.1, 3.1, 4.4, 5.1, 6.1, 7.1, 9.5_

- [ ] 7. Implement the Input Form controller
  - [x] 7.1 Write `populateCategoryDropdown()` — clears `<select id="category">` and rebuilds `<option>` elements from `[...BUILT_IN_CATEGORIES, ...customCategories]`
    - _Requirements: 1.2, 5.2_
  - [x] 7.2 Write the `transaction-form` submit handler — calls `validateTransaction`, shows/clears inline errors, creates a transaction object with `id` (via `crypto.randomUUID()` or `Date.now().toString()`), `name`, `amount`, `category`, `date` (ISO string), pushes to `transactions[]`, calls `saveTransactions()`, calls `render()`, resets the form
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 8. Implement the Transaction List view
  - Write `renderList(items)` — clears `<ul id="transaction-list">`, iterates `items` and appends `<li>` elements each containing the item name, formatted amount, a category badge `<span>`, and a `<button class="delete-btn" data-id="...">Delete</button>`
  - Wire the delete event using event delegation on `#transaction-list`: on click of `.delete-btn`, read `data-id`, filter it out of `transactions[]`, call `saveTransactions()`, call `render()`
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [x] 9. Implement the Balance Display view
  - Write `renderBalance(items)` — calls `calculateBalance(items)`, formats with `formatCurrency`, sets `document.getElementById('total-amount').textContent`
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 10. Implement the Pie Chart view
  - Write `renderChart(items)` — calls `aggregateByCategory(items)` to get labels and data; if `items` is empty or all amounts are zero, hide `#spending-chart`, show `#chart-empty-msg`, and return early
  - On first call, create the `Chart.js` instance: `chartInstance = new Chart(canvas, { type: 'pie', data: { labels, datasets: [{ data, backgroundColor: CHART_COLORS }] }, options: { plugins: { legend: { display: true } } } })` and assign to `let chartInstance`
  - On subsequent calls, update `chartInstance.data.labels`, `chartInstance.data.datasets[0].data` and `chartInstance.data.datasets[0].backgroundColor`, then call `chartInstance.update()`
  - Show canvas and hide empty message when data is present
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 11. Implement the Category Manager controller
  - Wire `#add-category-btn` click handler: trim `#new-category` value, call `validateCategory(name, [...BUILT_IN_CATEGORIES, ...customCategories])`, show/clear `#category-error` on failure, on success push to `customCategories[]`, call `saveCategories()`, call `populateCategoryDropdown()`, clear the input
  - Clear `#category-error` on `input` event of `#new-category`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 12. Implement Monthly Summary filtering
  - Wire `#month-filter` `change` event: set `activeMonth = event.target.value || null`, call `render()`
  - Wire `#clear-month-btn` click: set `activeMonth = null`, clear `#month-filter` value, call `render()`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 13. Implement Sort control
  - Wire `#sort-select` `change` event: set `activeSort = event.target.value`, call `render()`
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 14. Implement the central `render()` function
  - Derive `filteredTransactions = filterByMonth(transactions, activeMonth)`
  - Derive `displayedTransactions = sortTransactions(filteredTransactions, activeSort)`
  - Call `renderList(displayedTransactions)`
  - Call `renderBalance(filteredTransactions)` (balance uses filtered but unsorted list)
  - Call `renderChart(filteredTransactions)`
  - _Requirements: 3.2, 3.3, 4.2, 4.3, 6.3, 7.2, 7.3_

- [x] 15. Implement app initialization
  - In the `DOMContentLoaded` handler: call `loadTransactions()` → assign to `transactions`, call `loadCategories()` → assign to `customCategories`, call `populateCategoryDropdown()`, call `render()`
  - Attach all event listeners (form submit, delete delegation, sort change, month filter change, clear month, add category)
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 16. Checkpoint — Full functional smoke test
  - Add a transaction, verify it appears in the list, balance updates, chart updates
  - Delete a transaction, verify removal, balance and chart update
  - Add a custom category, verify it appears in the dropdown and persists after page reload
  - Filter by month, clear filter, sort by each option
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Implement error handling and edge cases
  - [x] 17.1 Implement `showToast(message)` — creates a `<div class="toast">` element, appends to `<body>`, auto-removes after 3 seconds; use CSS animation for fade-in/fade-out
    - _Requirements: (storage error UX from design error handling section)_
  - [x] 17.2 Add Chart.js availability check in the init block — if `typeof window.Chart === 'undefined'`, hide `#spending-chart`, show a message `"Chart unavailable — please check your internet connection."` in place of the canvas, and skip all `renderChart` calls
    - _Requirements: 4.5_
  - [x] 17.3 Add `input` event listeners to `#item-name` and `#amount` to clear their respective inline error spans as the user types
    - _Requirements: 1.5, 1.6_

- [x] 18. Write responsive CSS in `style.css`
  - Use mobile-first layout: base styles target 320 px, use `@media (min-width: 600px)` and `@media (min-width: 1024px)` breakpoints for progressively wider layouts
  - Apply CSS Grid or Flexbox to arrange the form, list, and chart side-by-side on wider screens
  - Style each component using the pastel CSS variables defined in task 1; ensure sufficient color contrast (at minimum WCAG AA large text)
  - Style the transaction list as a scrollable container with `max-height` and `overflow-y: auto`
  - Style the `.delete-btn`, sort select, month filter, and category manager inputs
  - Style the `.toast` notification (fixed position, bottom-right, fade animation)
  - Style error spans (`.error`) in red with small font size
  - _Requirements: 2.2, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 19. Set up property-based test infrastructure
  - Create `tests/` directory and `tests/properties.js`
  - Add a `package.json` (or `tests/package.json`) with `fast-check` as a dev dependency and a `"test"` script: `node tests/properties.js`
  - At the top of `tests/properties.js`, import all pure functions from `logic.js` using CommonJS `require` (or ESM `import` if `"type": "module"` is set) and import `fc` from `fast-check`
  - Define a reusable `transactionArb` arbitrary: `fc.record({ id: fc.string({ minLength: 1 }), name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), amount: fc.float({ min: 0.01, max: 1e6 }), category: fc.constantFrom(...BUILT_IN_CATEGORIES), date: fc.date().map(d => d.toISOString()) })`
  - _Requirements: (testing infrastructure)_

- [ ] 20. Write property-based tests
  - [x] 20.1 Write property test for Property 1: Transaction persistence round-trip
    - `fc.assert(fc.property(fc.array(transactionArb), txs => { const json = serializeTransactions(txs); const result = deserializeTransactions(json); return JSON.stringify(result) === JSON.stringify(txs); }))`
    - **Property 1: Transaction persistence round-trip**
    - **Validates: Requirements 1.4, 8.1, 8.3**
  - [x] 20.2 Write property test for Property 2: Balance equals sum of filtered transactions
    - **Property 2: Balance equals sum of filtered transactions**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  - [x] 20.3 Write property test for Property 3: Whitespace and empty inputs are rejected
    - Use `fc.string().filter(s => s.trim() === '')` as the name arbitrary
    - **Property 3: Whitespace and empty inputs are rejected**
    - **Validates: Requirements 1.5**
  - [x] 20.4 Write property test for Property 4: Non-positive amounts are rejected
    - Use `fc.float({ max: 0 })` as the amount arbitrary
    - **Property 4: Non-positive amounts are rejected**
    - **Validates: Requirements 1.6**
  - [x] 20.5 Write property test for Property 5: Delete removes exactly one transaction
    - Use `fc.array(transactionArb, { minLength: 1 })` and pick a random index to delete
    - **Property 5: Delete removes exactly one transaction**
    - **Validates: Requirements 2.4, 2.5**
  - [x] 20.6 Write property test for Property 6: Chart data matches transaction totals by category
    - Verify `aggregateByCategory` labels equal distinct categories in the input array
    - **Property 6: Chart data matches transaction totals by category**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  - [x] 20.7 Write property test for Property 7: Custom category uniqueness (case-insensitive)
    - Use `fc.string({ minLength: 1 })` for category name; ensure duplicate (same lowercase) is rejected
    - **Property 7: Custom category uniqueness (case-insensitive)**
    - **Validates: Requirements 5.5**
  - [x] 20.8 Write property test for Property 8: Monthly filter restricts transactions to selected month
    - **Property 8: Monthly filter restricts transactions to selected month**
    - **Validates: Requirements 6.2, 6.3, 6.4**
  - [x] 20.9 Write property test for Property 9: Sort is stable and non-destructive
    - Use `fc.constantFrom('default', 'amount-asc', 'amount-desc', 'category-az', 'category-za')` for the sort key
    - Verify result is a permutation of input and original array is unchanged
    - **Property 9: Sort is stable and non-destructive**
    - **Validates: Requirements 7.2, 7.3**
  - [x] 20.10 Write property test for Property 10: Custom category persistence round-trip
    - **Property 10: Custom category persistence round-trip**
    - **Validates: Requirements 5.3, 5.6, 8.2, 8.4**

- [ ] 21. Final checkpoint — Run all tests and verify complete feature
  - Run `npm test` (or `node tests/properties.js`) and confirm all property tests pass with ≥ 100 iterations each
  - Verify the full manual smoke test checklist from the design (add, delete, filter, sort, reload, resize to 320 px, empty form submission)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `logic.js` holds all pure, DOM-free functions so they can be imported by `tests/properties.js` without a browser environment
- Each task references specific requirements for traceability
- Checkpoints at tasks 5, 16, and 21 ensure incremental validation
- Property tests validate universal correctness properties; unit tests (smoke) validate specific examples and edge cases
- The `render()` function (task 14) is the single integration point — all state mutations must end with a `render()` call
