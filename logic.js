class Transaction {
  constructor(crypto, name, amount, category)
  {
    this.id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
    this.name = name;
    this.amount = Number(amount);
    this.category = category;
    this.date = new Date().toISOString();
  }
}
// Pure logic functions — exported for property-based testing
// This module is DOM-free and can be imported by tests/properties.js
// All functions will be implemented in task 3.

// ------------------------------------------------------------------
// § 3.1 · validateTransaction(name, amount)
// ------------------------------------------------------------------

/**
 * Validates the name and amount fields of a new transaction.
 *
 * Rules:
 *   - name must be a non-empty string after trimming (whitespace-only rejected)
 *   - amount must be a positive number (> 0); zero → "Please enter a positive amount.",
 *     negative → "Amount must be greater than zero."
 *
 * @param {string} name   - Item name entered by the user.
 * @param {number} amount - Amount entered by the user (numeric, may be 0 or negative).
 * @returns {{ valid: boolean, errors: { name?: string, amount?: string } }}
 */
function validateTransaction(name, amount) {
  const errors = {};

  // Validate name: reject empty string and whitespace-only strings
  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Please enter an item name.';
  }

  // Validate amount
  const numericAmount = Number(amount);
  if (amount === '' || amount === null || amount === undefined || isNaN(numericAmount) || numericAmount === 0) {
    errors.amount = 'Please enter a positive amount.';
  } else if (numericAmount < 0) {
    errors.amount = 'Amount must be greater than zero.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ------------------------------------------------------------------
// § 3.2 · calculateBalance(transactions)
// ------------------------------------------------------------------

/**
 * Returns the arithmetic sum of the `amount` fields across all transactions.
 *
 * @param {Array<{amount: number}>} transactions - Array of transaction objects.
 * @returns {number} The total balance.
 */
function calculateBalance(transactions) {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

// ------------------------------------------------------------------
// § 3.3 · formatCurrency(amount)
// ------------------------------------------------------------------

/**
 * Formats a numeric amount as an IDR currency string with exactly two decimal places.
 *
 * Uses `toLocaleString('en-US', { style: 'currency', currency: 'IDR' })` and then
 * ensures the fractional part is always exactly two digits.
 *
 * @param {number} amount - The numeric amount to format.
 * @returns {string} A currency-formatted string, e.g. "IDR 1,234.56".
 */
function formatCurrency(amount) {
  return Number(amount).toLocaleString('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ------------------------------------------------------------------
// § 3.4 · aggregateByCategory(transactions)
// ------------------------------------------------------------------

/**
 * Aggregates transaction amounts by category.
 *
 * @param {Array<{category: string, amount: number}>} transactions - Array of transaction objects.
 * @returns {{ [category: string]: number }} An object mapping each category name to the
 *   total sum of all `amount` values for transactions in that category.
 */
function aggregateByCategory(transactions) {
  return transactions.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});
}

// ------------------------------------------------------------------
// § 3.5 · filterByMonth(transactions, monthString)
// ------------------------------------------------------------------

/**
 * Filters transactions to those whose date falls within the given month.
 *
 * @param {Array<{date: string}>} transactions - Array of transaction objects with ISO 8601 date strings.
 * @param {string|null} monthString - A "YYYY-MM" prefix string, or null to return all transactions.
 * @returns {Array} The filtered (or original) transactions array.
 */
function filterByMonth(transactions, monthString) {
  if (monthString === null) {
    return transactions;
  }
  return transactions.filter(tx => tx.date.startsWith(monthString));
}

// ------------------------------------------------------------------
// § 3.6 · sortTransactions(transactions, sortKey)
// ------------------------------------------------------------------

/**
 * Returns a new sorted array of transactions without mutating the original.
 *
 * Sort keys:
 *   - `default`      — most-recent-first by date (descending)
 *   - `amount-asc`   — ascending by amount
 *   - `amount-desc`  — descending by amount
 *   - `category-az`  — category name A–Z (ascending, case-insensitive)
 *   - `category-za`  — category name Z–A (descending, case-insensitive)
 *
 * Unknown sort keys fall back to `default` behavior.
 *
 * @param {Array<{date: string, amount: number, category: string}>} transactions
 * @param {string} sortKey
 * @returns {Array} A new sorted array (original is unchanged).
 */
function sortTransactions(transactions, sortKey) {
  const copy = [...transactions];

  switch (sortKey) {
    case 'amount-asc':
      return copy.sort((a, b) => a.amount - b.amount);

    case 'amount-desc':
      return copy.sort((a, b) => b.amount - a.amount);

    case 'category-az':
      return copy.sort((a, b) =>
        a.category.toLowerCase().localeCompare(b.category.toLowerCase())
      );

    case 'category-za':
      return copy.sort((a, b) =>
        b.category.toLowerCase().localeCompare(a.category.toLowerCase())
      );

    case 'default':
    default:
      // Most-recent-first: compare ISO 8601 date strings (lexicographic order works for ISO dates)
      return copy.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }
}

// ------------------------------------------------------------------
// § 3.7 · validateCategory(name, existingCategories)
// ------------------------------------------------------------------

/**
 * Validates a new custom category name against an existing list.
 *
 * Rules:
 *   - name must be a non-empty string after trimming (whitespace-only rejected)
 *   - name (trimmed, lowercased) must not already exist in existingCategories (case-insensitive)
 *
 * @param {string}   name               - Category name entered by the user.
 * @param {string[]} existingCategories - Array of existing category names (built-in + custom).
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCategory(name, existingCategories) {
  const trimmed = typeof name === 'string' ? name.trim() : '';

  if (trimmed.length === 0) {
    return { valid: false, error: 'Please enter a category name.' };
  }

  const lowerTrimmed = trimmed.toLowerCase();
  const isDuplicate = existingCategories.some(
    cat => cat.toLowerCase() === lowerTrimmed
  );

  if (isDuplicate) {
    return { valid: false, error: 'This category already exists.' };
  }

  return { valid: true };
}

// ------------------------------------------------------------------
// § 3.8 · serializeTransactions(transactions) / deserializeTransactions(json)
// ------------------------------------------------------------------

/**
 * Serializes the transactions array to a JSON string for Local Storage.
 *
 * Wraps `JSON.stringify` in a try/catch so a circular-reference or other
 * stringify error never crashes the caller. Returns an empty JSON array
 * string on failure.
 *
 * @param {Array} transactions - The in-memory transactions array.
 * @returns {string} A JSON string representing the transactions array.
 */
function serializeTransactions(transactions) {
  try {
    return JSON.stringify(transactions);
  } catch (err) {
    console.warn('[expense-visualizer] serializeTransactions failed:', err);
    return '[]';
  }
}

/**
 * Deserializes a JSON string back into a transactions array.
 *
 * Wraps `JSON.parse` in a try/catch; returns an empty array and logs a
 * console warning when the string is null, undefined, or malformed JSON.
 *
 * @param {string|null} json - The raw string retrieved from Local Storage.
 * @returns {Array} The parsed transactions array, or `[]` on failure.
 */
function deserializeTransactions(json) {
  try {
    const parsed = JSON.parse(json);
    // Guard against non-array values (e.g. a bare number or object in storage)
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[expense-visualizer] deserializeTransactions failed — returning empty array:', err);
    return [];
  }
}

// ------------------------------------------------------------------
// § 3.9 · serializeCategories(categories) / deserializeCategories(json)
// ------------------------------------------------------------------

/**
 * Serializes the custom categories array to a JSON string for Local Storage.
 *
 * Wraps `JSON.stringify` in a try/catch so a circular-reference or other
 * stringify error never crashes the caller. Returns an empty JSON array
 * string on failure.
 *
 * @param {string[]} categories - The in-memory custom categories array.
 * @returns {string} A JSON string representing the categories array.
 */
function serializeCategories(categories) {
  try {
    return JSON.stringify(categories);
  } catch (err) {
    console.warn('[expense-visualizer] serializeCategories failed:', err);
    return '[]';
  }
}

/**
 * Deserializes a JSON string back into a custom categories array.
 *
 * Wraps `JSON.parse` in a try/catch; returns an empty array and logs a
 * console warning when the string is null, undefined, or malformed JSON.
 *
 * @param {string|null} json - The raw string retrieved from Local Storage.
 * @returns {string[]} The parsed categories array, or `[]` on failure.
 */
function deserializeCategories(json) {
  try {
    const parsed = JSON.parse(json);
    // Guard against non-array values (e.g. a bare number or object in storage)
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[expense-visualizer] deserializeCategories failed — returning empty array:', err);
    return [];
  }
}

// ------------------------------------------------------------------
// Exports — UMD-style guard so logic.js works in both Node.js (tests)
// and plain <script> tags in the browser (no module bundler).
// ------------------------------------------------------------------
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateTransaction, calculateBalance, formatCurrency, aggregateByCategory, filterByMonth, sortTransactions, validateCategory, serializeTransactions, deserializeTransactions, serializeCategories, deserializeCategories };
}
