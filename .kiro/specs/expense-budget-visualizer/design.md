# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a fully client-side web application delivered as three files: `index.html`, `style.css`, and `script.js`. There is no build step, no server, and no external dependencies beyond Chart.js (loaded from CDN) and a Google Font. All state lives in the browser's Local Storage.

The app lets users record expense transactions (name, amount, category), view a running total balance, see a pie chart of spending by category, filter by month, sort the list, and manage custom categories. The UI targets a soft pastel aesthetic and must be usable on screens from 320 px to 1920 px wide.

### Key Design Decisions

- **Vanilla JS, no framework**: Keeps the code beginner-friendly and eliminates build tooling. DOM manipulation is done with standard `document.querySelector` / `createElement` patterns.
- **Chart.js via CDN**: Provides a production-quality pie chart without a build step. Version pinned in the `<script>` tag to avoid unexpected breaking changes.
- **Single source of truth in memory**: An in-memory array `transactions[]` and a `customCategories[]` array are the canonical state. All renders read from these arrays; Local Storage is written on every mutation.
- **Event-driven updates**: A central `render()` function re-draws the transaction list, balance, and chart whenever state changes. This keeps logic simple and avoids stale UI.

---

## Architecture

The application follows a simple **Model → View → Controller** pattern without any framework:

```
┌─────────────────────────────────────────────────────────┐
│                        index.html                        │
│  (structure: form, list, chart canvas, summary section)  │
└──────────────────────────┬──────────────────────────────┘
                           │ loads
          ┌────────────────▼────────────────┐
          │           script.js              │
          │                                  │
          │  ┌──────────┐  ┌─────────────┐  │
          │  │  Model   │  │  Controller │  │
          │  │          │  │             │  │
          │  │transactions│ │ event       │  │
          │  │[]        │  │ listeners   │  │
          │  │custom    │  │ (form submit│  │
          │  │Categories│  │  delete btn │  │
          │  │[]        │  │  sort ctrl  │  │
          │  │activeSort│  │  month sel  │  │
          │  │activeMonth│ │  cat mgr)   │  │
          │  └────┬─────┘  └──────┬──────┘  │
          │       │               │          │
          │       └───────┬───────┘          │
          │               │                  │
          │        ┌──────▼──────┐           │
          │        │    View     │           │
          │        │  render()   │           │
          │        │  renderList │           │
          │        │  renderChart│           │
          │        │  renderBal  │           │
          │        └─────────────┘           │
          └─────────────────────────────────┘
                           │ reads/writes
          ┌────────────────▼────────────────┐
          │         Local Storage            │
          │  "evbv_transactions"  (JSON)     │
          │  "evbv_categories"    (JSON)     │
          └─────────────────────────────────┘
```

### File Responsibilities

| File | Responsibility |
|---|---|
| `index.html` | Semantic HTML structure, CDN script tags, meta viewport |
| `style.css` | Pastel palette variables, responsive grid/flex layout, component styles |
| `script.js` | All application logic: state, event handlers, render functions, storage helpers |

---

## Components and Interfaces

### 1. Input Form

**HTML elements**: `<form id="transaction-form">`, `<input id="item-name">`, `<input id="amount" type="number">`, `<select id="category">`, `<button type="submit">`, inline `<span class="error">` elements per field.

**Behaviour**:
- On `submit`: validate → create transaction object → push to `transactions[]` → save → render → reset form.
- Validation runs synchronously before any state mutation.
- Category `<select>` is rebuilt whenever `customCategories[]` changes.

### 2. Transaction List

**HTML elements**: `<ul id="transaction-list">`, each item is `<li>` containing name, amount, category badge, and a `<button class="delete-btn">`.

**Behaviour**:
- Rendered by `renderList(items)` which accepts a pre-sorted, pre-filtered array.
- Delete button carries `data-id` attribute matching the transaction's `id`.
- Sort controls are `<select id="sort-select">` with options: `default`, `amount-asc`, `amount-desc`, `category-az`, `category-za`.

### 3. Balance Display

**HTML elements**: `<div id="balance-display">` containing a `<span id="total-amount">`.

**Behaviour**:
- `renderBalance(items)` sums the `amount` field of the passed array and formats with `toLocaleString('en-US', { style: 'currency', currency: 'IDR' })`.
- Receives the same filtered array as the list so monthly filter affects the balance too.

### 4. Pie Chart

**HTML elements**: `<canvas id="spending-chart">`, `<p id="chart-empty-msg">` (shown when no data).

**Behaviour**:
- Managed by a single `Chart.js` instance stored in `let chartInstance`.
- `renderChart(items)` aggregates amounts by category, then calls `chartInstance.data = …; chartInstance.update()`.
- If `items` is empty or all amounts are zero, the canvas is hidden and the empty message is shown.
- Colors are drawn from a fixed pastel palette array; categories cycle through it.

### 5. Category Manager

**HTML elements**: `<input id="new-category">`, `<button id="add-category-btn">`, `<span id="category-error">`.

**Behaviour**:
- On button click: trim input → validate non-empty and case-insensitive uniqueness against `[...BUILT_IN_CATEGORIES, ...customCategories]` → push to `customCategories[]` → save → rebuild category `<select>`.

### 6. Monthly Summary

**HTML elements**: `<input id="month-filter" type="month">`, `<button id="clear-month-btn">`.

**Behaviour**:
- `activeMonth` state variable holds the current filter value (`"YYYY-MM"` string or `null`).
- On change: set `activeMonth` → call `render()`.
- `render()` derives `filteredTransactions` from `transactions[]` filtered by `activeMonth` (comparing transaction date's `YYYY-MM` prefix).
- All view functions (list, balance, chart) receive `filteredTransactions`.

### 7. Storage Helpers

```js
// Keys
const STORAGE_KEY_TX   = 'evbv_transactions';
const STORAGE_KEY_CATS = 'evbv_categories';

function saveTransactions()  { localStorage.setItem(STORAGE_KEY_TX,   JSON.stringify(transactions)); }
function saveCategories()    { localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(customCategories)); }
function loadTransactions()  { return JSON.parse(localStorage.getItem(STORAGE_KEY_TX)  ?? '[]'); }
function loadCategories()    { return JSON.parse(localStorage.getItem(STORAGE_KEY_CATS) ?? '[]'); }
```

---

## Data Models

### Transaction Object

```js
{
  id:        string,   // crypto.randomUUID() or Date.now().toString()
  name:      string,   // item name, trimmed, non-empty
  amount:    number,   // positive float, stored as number
  category:  string,   // one of BUILT_IN_CATEGORIES or customCategories
  date:      string    // ISO 8601 date string: new Date().toISOString()
}
```

### Custom Category

Stored as a plain `string[]` array. Each entry is a trimmed, non-empty string. Uniqueness is enforced case-insensitively at insertion time.

### App State (in-memory, script.js module scope)

```js
let transactions     = [];   // Transaction[]
let customCategories = [];   // string[]
let activeSort       = 'default';   // sort key
let activeMonth      = null;        // 'YYYY-MM' | null
let chartInstance    = null;        // Chart.js instance
```

### Built-in Categories

```js
const BUILT_IN_CATEGORIES = ['Food', 'Transport', 'Fun', 'Hygiene', 'Skincare', 'Makeup'];
```

### Pastel Color Palette

```js
const CHART_COLORS = [
  '#FFB3BA', // pink
  '#FFDFBA', // peach
  '#FFFFBA', // yellow
  '#BAFFC9', // mint
  '#BAE1FF', // sky blue
  '#E8BAFF', // lavender
  '#FFD6E0', // rose
  '#C9F0FF', // light cyan
];
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Transaction persistence round-trip

*For any* valid transaction object (non-empty name, positive amount, valid category), serializing the transactions array to Local Storage and then deserializing it SHALL produce an array containing an equivalent transaction with the same name, amount, category, and id.

**Validates: Requirements 1.4, 8.1, 8.3**

---

### Property 2: Balance equals sum of filtered transactions

*For any* array of transactions (including the empty array), the value displayed by the Balance Display SHALL equal the arithmetic sum of the `amount` fields of those transactions, formatted to two decimal places.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

---

### Property 3: Whitespace and empty inputs are rejected

*For any* string composed entirely of whitespace characters (or the empty string) submitted as an item name, the Validator SHALL reject the submission and leave the transactions array unchanged.

**Validates: Requirements 1.5**

---

### Property 4: Non-positive amounts are rejected

*For any* numeric value that is zero or negative submitted as an amount, the Validator SHALL reject the submission and leave the transactions array unchanged.

**Validates: Requirements 1.6**

---

### Property 5: Delete removes exactly one transaction

*For any* transactions array and any transaction id present in that array, deleting by that id SHALL produce an array that contains every other transaction unchanged and does not contain the deleted transaction.

**Validates: Requirements 2.4, 2.5**

---

### Property 6: Chart data matches transaction totals by category

*For any* array of transactions, the data passed to the Chart SHALL have each category's value equal to the sum of `amount` for all transactions in that category, and the set of labels SHALL equal the set of distinct categories present in the transactions.

**Validates: Requirements 4.1, 4.2, 4.3**

---

### Property 7: Custom category uniqueness (case-insensitive)

*For any* existing category list and any new category name whose lowercase form already appears in the list, the Category Manager SHALL reject the addition and leave the category list unchanged.

**Validates: Requirements 5.5**

---

### Property 8: Monthly filter restricts transactions to selected month

*For any* transactions array and any selected month value `"YYYY-MM"`, the filtered set displayed SHALL contain only transactions whose `date` field starts with that `"YYYY-MM"` prefix, and no transactions from any other month.

**Validates: Requirements 6.2, 6.3, 6.4**

---

### Property 9: Sort is stable and non-destructive

*For any* transactions array and any sort option, applying the sort SHALL produce a permutation of the original array (same elements, same count) without modifying the underlying `transactions[]` array in storage.

**Validates: Requirements 7.2, 7.3**

---

### Property 10: Custom category persistence round-trip

*For any* non-empty, unique custom category name, adding it and then reloading from Storage SHALL produce a category list that contains that name.

**Validates: Requirements 5.3, 5.6, 8.2, 8.4**

---

### Property 11: Currency formatting has two decimal places

*For any* non-negative numeric total, the formatted balance string SHALL contain exactly two digits after the decimal separator and a currency symbol.

**Validates: Requirements 3.4**

---

### Property 12: Default sort order is most-recent-first

*For any* transactions array, applying the default sort SHALL produce an array ordered by descending date (most recently added transaction first), which is the reverse of insertion order.

**Validates: Requirements 2.3, 7.4**

---

### Property 13: Clearing the month filter restores all transactions

*For any* transactions array and any previously active month filter, clearing the filter (setting it to null) SHALL result in the displayed set being equal to the full unfiltered transactions array.

**Validates: Requirements 6.5**

---

### Property 14: Category dropdown always contains all built-in categories

*For any* custom category list (including the empty list), the category dropdown SHALL always contain all six built-in categories (Food, Transport, Fun, Hygiene, Skincare, Makeup) in addition to any custom categories.

**Validates: Requirements 1.2**

---

## Error Handling

### Validation Errors (user-facing, inline)

| Trigger | Error Location | Message |
|---|---|---|
| Empty item name | Below name field | "Please enter an item name." |
| Empty or zero amount | Below amount field | "Please enter a positive amount." |
| Negative amount | Below amount field | "Amount must be greater than zero." |
| Empty category name (Category Manager) | Below category input | "Please enter a category name." |
| Duplicate category name | Below category input | "This category already exists." |

All error messages are cleared on the next successful submission or when the user starts typing in the relevant field (`input` event listener).

### Storage Errors

Local Storage can throw `QuotaExceededError` or be unavailable in private browsing on some browsers. The app wraps all `localStorage.setItem` calls in a `try/catch`. On failure, a non-blocking toast notification is shown: *"Could not save data. Storage may be full or unavailable."* The in-memory state is still updated so the session remains functional.

### JSON Parse Errors

`loadTransactions()` and `loadCategories()` wrap `JSON.parse` in a `try/catch`. On parse failure (e.g., corrupted storage), the function returns an empty array and logs a warning to the console. The app starts fresh rather than crashing.

### Chart.js Unavailable

If the Chart.js CDN script fails to load (offline, blocked), `window.Chart` will be undefined. The app checks for this on init and, if absent, hides the chart canvas and shows a message: *"Chart unavailable — please check your internet connection."*

---


### Approach

Because this project has no build tooling and targets beginner-friendly vanilla JS, the testing strategy is pragmatic:

- **Manual smoke tests** cover the full user journey (add, delete, filter, sort, reload).
- **Unit tests** (optional, using a simple test runner like [uvu](https://github.com/lukeed/uvu) or plain `console.assert` scripts) cover pure helper functions.
- **Property-based tests** cover the correctness properties defined above, using [fast-check](https://github.com/dubzzz/fast-check) in a Node.js test script that imports the pure logic functions.

Since the project has no build step, property tests are run as a separate Node.js script (`tests/properties.js`) that imports only the pure, DOM-free logic extracted from `script.js` into a shared module (`logic.js`). The DOM-dependent rendering functions are not property-tested.

### PBT Applicability Assessment

This feature contains several pure functions that are excellent candidates for property-based testing:

- **Transaction validation** (pure: input → valid/invalid + error message)
- **Balance calculation** (pure: Transaction[] → number)
- **Category aggregation for chart** (pure: Transaction[] → Map<string, number>)
- **Sort functions** (pure: Transaction[] → Transaction[])
- **Monthly filter** (pure: Transaction[] + month string → Transaction[])
- **Storage serialization/deserialization** (pure round-trip)
- **Custom category validation** (pure: string + string[] → valid/invalid)

### Property-Based Test Configuration

- Library: **fast-check** (loaded via CDN or npm for the test script)
- Minimum **100 iterations** per property test
- Each test tagged with: `// Feature: expense-budget-visualizer, Property N: <property_text>`

### Property Test Mapping

| Property | Test Description | fast-check Arbitraries |
|---|---|---|
| P1: Persistence round-trip | Serialize then deserialize transactions array | `fc.array(transactionArb)` |
| P2: Balance equals sum | Sum of amounts matches display value | `fc.array(transactionArb)` |
| P3: Whitespace name rejected | Whitespace-only names never added | `fc.string().filter(s => s.trim() === '')` |
| P4: Non-positive amount rejected | Zero/negative amounts never added | `fc.float({ max: 0 })` |
| P5: Delete removes exactly one | Array minus deleted item | `fc.array(transactionArb, { minLength: 1 })` |
| P6: Chart data matches totals | Category sums match chart data | `fc.array(transactionArb)` |
| P7: Category uniqueness | Duplicate names rejected | `fc.string({ minLength: 1 })` |
| P8: Monthly filter | Only matching-month transactions shown | `fc.array(transactionArb)` + `fc.string()` |
| P9: Sort is non-destructive | Sort doesn't mutate source array | `fc.array(transactionArb)` + `fc.constantFrom(sortOptions)` |
| P10: Category persistence round-trip | Save then load returns same categories | `fc.array(fc.string({ minLength: 1 }))` |

### Unit Test Coverage (Example-Based)

- Form resets after successful submission
- Empty state shows placeholder chart message
- Clearing month filter restores full transaction list
- Default sort order is most-recent-first
- Built-in categories always present in dropdown

### Manual Smoke Test Checklist

1. Add a transaction → appears in list, balance updates, chart updates
2. Delete a transaction → removed from list, balance updates, chart updates
3. Add a custom category → appears in dropdown, persists after reload
4. Filter by month → only that month's transactions shown
5. Clear month filter → all transactions shown
6. Sort by amount ascending/descending → list reorders
7. Sort by category A–Z / Z–A → list reorders
8. Reload page → all transactions and categories restored
9. Resize to 320 px → layout remains usable
10. Submit empty form → inline errors shown, no transaction added
