'use strict';

/* ============================================================
   script.js — Expense & Budget Visualizer
   Entry point: DOMContentLoaded (see bottom of file)
   ============================================================
   Sections:
     1. Constants
     2. State
     3. Storage helpers        (task 4)
     4. UI / render functions  (tasks 7–14)
     5. Initialisation         (task 15)
   ============================================================ */

// ------------------------------------------------------------------
// § 1 · CONSTANTS
// ------------------------------------------------------------------

/**
 * BUILT_IN_CATEGORIES — string[]
 * The fixed set of spending categories shipped with the app.
 * These are always present in the category <select> dropdown and
 * cannot be removed by the user. Custom categories are stored
 * separately in `customCategories[]`.
 */
const BUILT_IN_CATEGORIES = ['Food', 'Transport', 'Fun', 'Hygiene', 'Skincare', 'Makeup'];

/**
 * CHART_COLORS — string[]
 * Pastel hex colors cycled through when assigning a background color
 * to each slice of the Chart.js pie chart. Colors are assigned by
 * category index (modulo the array length) so they are consistent
 * across renders.
 */
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

/**
 * STORAGE_KEY_TX — string
 * The localStorage key under which the transactions array is persisted
 * as a JSON string.
 */
const STORAGE_KEY_TX = 'evbv_transactions';

/**
 * STORAGE_KEY_CATS — string
 * The localStorage key under which the custom categories array is
 * persisted as a JSON string.
 */
const STORAGE_KEY_CATS = 'evbv_categories';

// ------------------------------------------------------------------
// § 2 · STATE
// ------------------------------------------------------------------

/**
 * transactions — Transaction[]
 * The canonical in-memory list of all expense transactions recorded
 * by the user. Each entry is a plain object with the shape:
 *   { id: string, name: string, amount: number, category: string, date: string }
 * Mutated only through add / delete operations; persisted to
 * localStorage on every mutation via saveTransactions().
 */
let transactions = [];

/**
 * customCategories — string[]
 * User-defined category names added via the Category Manager.
 * Stored as trimmed, non-empty strings. Uniqueness is enforced
 * case-insensitively at insertion time. Persisted to localStorage
 * via saveCategories().
 */
let customCategories = [];

/**
 * activeSort — string
 * The currently selected sort key for the transaction list.
 * Valid values: 'default' | 'amount-asc' | 'amount-desc' |
 *               'category-az' | 'category-za'
 * 'default' means most-recently-added first (reverse insertion order).
 */
let activeSort = 'default';

/**
 * activeMonth — string | null
 * The currently active month filter in 'YYYY-MM' format, or null when
 * no filter is applied. Used by render() to derive filteredTransactions
 * via filterByMonth(). Affects the transaction list, balance, and chart.
 */
let activeMonth = null;

/**
 * chartInstance — Chart | null
 * Reference to the Chart.js pie-chart instance created on the first
 * renderChart() call. Reused on subsequent renders to call
 * chartInstance.update() rather than recreating the chart from scratch.
 * Null until the first render that has transaction data.
 */
let chartInstance = null;

/**
 * chartAvailable — boolean
 * Set to false during init if Chart.js failed to load (window.Chart is
 * undefined). When false, renderChart() calls are skipped entirely and
 * the canvas is hidden with a user-facing message.
 */
let chartAvailable = true;

// ------------------------------------------------------------------
// § 3 · STORAGE HELPERS
// ------------------------------------------------------------------

/**
 * showToast(message)
 * Displays a non-blocking notification to the user.
 * TODO: implement full UI in task 17.1
 *
 * @param {string} message - The message to display.
 */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Remove from DOM after 3 seconds (matches the CSS animation total duration)
  setTimeout(function () {
    toast.remove();
  }, 3000);
}

/**
 * saveTransactions()
 * Persists the in-memory `transactions` array to localStorage.
 * Wraps localStorage.setItem in a try/catch; on any error (including
 * QuotaExceededError) a toast notification is shown but the in-memory
 * state remains intact so the current session continues to work.
 */
function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY_TX, serializeTransactions(transactions));
  } catch (err) {
    console.warn('[expense-visualizer] saveTransactions failed:', err);
    showToast('Could not save data. Storage may be full or unavailable.');
  }
}

/**
 * saveCategories()
 * Persists the in-memory `customCategories` array to localStorage.
 * Wraps localStorage.setItem in a try/catch; on any error (including
 * QuotaExceededError) a toast notification is shown but the in-memory
 * state remains intact so the current session continues to work.
 */
function saveCategories() {
  try {
    localStorage.setItem(STORAGE_KEY_CATS, serializeCategories(customCategories));
  } catch (err) {
    console.warn('[expense-visualizer] saveCategories failed:', err);
    showToast('Could not save data. Storage may be full or unavailable.');
  }
}

/**
 * loadTransactions()
 * Reads the transactions JSON string from localStorage and returns the
 * parsed array. Delegates error handling (null / malformed JSON) to
 * `deserializeTransactions`, which returns [] on failure.
 *
 * @returns {Array} The stored transactions array, or [] if not found / invalid.
 */
function loadTransactions() {
  const raw = localStorage.getItem(STORAGE_KEY_TX);
  if(raw === null)
  {
    console.log('No data of key ', STORAGE_KEY_TX,' is found');
    return;
  }
  return deserializeTransactions(raw);
}

/**
 * loadCategories()
 * Reads the custom categories JSON string from localStorage and returns
 * the parsed array. Delegates error handling to `deserializeCategories`,
 * which returns [] on failure.
 *
 * @returns {string[]} The stored custom categories array, or [] if not found / invalid.
 */
function loadCategories() {
  const raw = localStorage.getItem(STORAGE_KEY_CATS);
  if(raw === null)
  {
    console.log('No category of key ', STORAGE_KEY_CATS, ' is found');
    return;
  }
  return deserializeCategories(raw);
}

// ------------------------------------------------------------------
// § 4 · RENDER FUNCTIONS  (implemented in tasks 7–14)
// ------------------------------------------------------------------

/**
 * populateCategoryDropdown()
 * Clears all existing <option> elements from <select id="category">
 * and rebuilds them from the combined list of built-in and custom
 * categories. Called on init and whenever a custom category is added.
 */
function populateCategoryDropdown() {
  const select = document.getElementById('category');
  select.innerHTML = '';
  if(customCategories === null || customCategories === undefined)
  {
    console.log("Categories are not found or undefined!");
    return;
  }
  var cats = [...BUILT_IN_CATEGORIES, ...customCategories];
  if(cats === null)
  {
    console.log("Categories are not found");
    return;
  }
  cats.forEach(function (cat) {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

/**
 * handleTransactionSubmit(event)
 * Submit handler for <form id="transaction-form">.
 *
 * Steps:
 *   1. Prevent default form submission.
 *   2. Read and trim field values.
 *   3. Validate via validateTransaction(); show/clear inline error spans.
 *   4. On success: build a transaction object, push to transactions[],
 *      persist, re-render, and reset the form.
 *
 * @param {Event} event - The form submit event.
 */
function handleTransactionSubmit(event) {
  event.preventDefault();

  const nameInput   = document.getElementById('item-name');
  const amountInput = document.getElementById('amount');
  const categoryEl  = document.getElementById('category');
  const nameError   = document.getElementById('name-error');
  const amountError = document.getElementById('amount-error');

  const name     = nameInput.value.trim();
  const rawAmount = amountInput.value;
  const amount   = rawAmount === '' ? '' : Number(rawAmount);
  const category = categoryEl.value;

  // --- Validate ---
  const { valid, errors } = validateTransaction(name, amount);

  // Show or clear the name error span
  nameError.textContent   = errors.name   || '';
  // Show or clear the amount error span
  amountError.textContent = errors.amount || '';

  if (!valid) {
    return; // Prevent submission — errors are now visible
  }

  // --- Build transaction object ---
  // const transaction = {
  //   id:       typeof crypto !== 'undefined' && crypto.randomUUID
  //               ? crypto.randomUUID()
  //               : Date.now().toString(),
  //   name,
  //   amount:   Number(amount),
  //   category,
  //   date:     new Date().toISOString(),
  // };

  var transaction = new Transaction(crypto, name, amount, category);
  console.log('Retrieved transaction data: ', JSON.stringify(transaction));

  if(transactions === undefined) transactions = [];

  // --- Mutate state ---
  transactions.push(transaction);
  saveTransactions();

  // --- Update UI ---
  if (typeof render === 'function') {
    render();
  }

  // --- Reset form ---
  event.target.reset();
}

/**
 * renderList(items)
 * Clears <ul id="transaction-list"> and rebuilds it from the provided
 * array of transaction objects. Each item is rendered as a <li> containing:
 *   - the item name
 *   - the formatted amount (via formatCurrency)
 *   - a category badge <span class="category-badge">
 *   - a delete <button class="delete-btn" data-id="...">
 *
 * This function is intentionally "dumb" — it renders exactly what it receives.
 * Filtering and sorting are applied upstream (in render()) before calling here.
 *
 * @param {Array<{id:string, name:string, amount:number, category:string, date:string}>} items
 */
function renderList(items) {
  const list = document.getElementById('transaction-list');
  list.innerHTML = '';

  items.forEach(function (item) {
    const li = document.createElement('li');
    li.className = 'transaction-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'transaction-name';
    nameSpan.textContent = item.name;

    const amountSpan = document.createElement('span');
    amountSpan.className = 'transaction-amount';
    amountSpan.textContent = formatCurrency(item.amount);

    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'category-badge';
    categoryBadge.textContent = item.category;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.id = item.id;
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Delete ' + item.name);

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    li.appendChild(categoryBadge);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  });
}

/**
 * renderBalance(items)
 * Computes the total balance from the provided transactions and updates
 * the balance display element in the DOM.
 *
 * Steps:
 *   1. Calls calculateBalance(items) to get the numeric sum of all amounts.
 *   2. Formats the result with formatCurrency() to produce the display string.
 *   3. Sets document.getElementById('total-amount').textContent to that string.
 *
 * @param {Array<{amount: number}>} items - The (filtered) transactions to sum.
 */
function renderBalance(items) {
  const total = calculateBalance(items);
  const formatted = formatCurrency(total);
  document.getElementById('total-amount').textContent = formatted;
}
/**
 * renderChart(items)
 * Renders (or updates) the Chart.js pie chart for spending by category.
 *
 * Steps:
 *   1. Aggregate transaction amounts by category via aggregateByCategory().
 *   2. If items is empty or all amounts are zero, hide the canvas and show the
 *      empty-state message, then return early.
 *   3. On the first call (chartInstance is null), create a new Chart.js instance
 *      and assign it to chartInstance.
 *   4. On subsequent calls, update the existing chartInstance data and call
 *      chartInstance.update() to redraw.
 *   5. Ensure the canvas is visible and the empty message is hidden when data exists.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 *
 * @param {Array<{category: string, amount: number}>} items - The (filtered) transactions to chart.
 */
function renderChart(items) {
  const canvas   = document.getElementById('spending-chart');
  const emptyMsg = document.getElementById('chart-empty-msg');

  // Guard: Chart.js unavailable (CDN failed to load) — flag set during init
  if (!chartAvailable) {
    return;
  }

  // Aggregate amounts by category
  const aggregated = aggregateByCategory(items);
  const labels     = Object.keys(aggregated);
  const data       = Object.values(aggregated);

  // Determine if there is any non-zero data to display
  const hasData = labels.length > 0 && data.some(function (v) { return v > 0; });

  if (!hasData) {
    // Hide chart, show empty message
    canvas.style.display   = 'none';
    emptyMsg.style.display = '';
    return;
  }

  // Build per-category background colors (cycle through CHART_COLORS)
  const backgroundColor = labels.map(function (_, i) {
    return CHART_COLORS[i % CHART_COLORS.length];
  });

  if (chartInstance === null) {
    // First call — create the Chart.js instance
    chartInstance = new window.Chart(canvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColor,
        }],
      },
      options: {
        plugins: {
          legend: {
            display: true,
          },
        },
      },
    });
  } else {
    // Subsequent calls — update existing instance in place
    chartInstance.data.labels                       = labels;
    chartInstance.data.datasets[0].data             = data;
    chartInstance.data.datasets[0].backgroundColor  = backgroundColor;
    chartInstance.update();
  }

  // Show canvas, hide empty message
  canvas.style.display   = '';
  emptyMsg.style.display = 'none';
}

/**
 * render()
 * The central re-render function. Called whenever application state
 * changes (add, delete, sort, month filter).
 *
 * Steps:
 *   1. Derive filteredTransactions by applying the active month filter.
 *   2. Derive displayedTransactions by applying the active sort to the
 *      filtered list (produces a new array — original is not mutated).
 *   3. Re-render the transaction list with the sorted, filtered items.
 *   4. Re-render the balance with the filtered (but unsorted) items so
 *      the total is independent of display order.
 *   5. Re-render the chart with the filtered items.
 *
 * Requirements: 3.2, 3.3, 4.2, 4.3, 6.3, 7.2, 7.3
 */
function render() {
  if(transactions === null || transactions === undefined)
  {
    console.log("Transactions are empty! (logic.js nya ngga masuk bangshaaaaaaat)");
    return;
  }
  if(activeMonth === null || activeMonth === undefined)
  {
    console.log("Active month is empty!");
    return;
  }

  const filteredTransactions  = filterByMonth(transactions, activeMonth);
  const displayedTransactions = sortTransactions(filteredTransactions, activeSort);

  renderList(displayedTransactions);
  renderBalance(filteredTransactions);
  if (chartAvailable) {
    renderChart(filteredTransactions);
  }
}

// ------------------------------------------------------------------
// § 5 · INITIALISATION
// ============================================================
// DOMContentLoaded — wires event listeners and boots the app
// ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  // --- Load persisted state ---
  transactions      = loadTransactions();
  customCategories  = loadCategories();

  // --- Chart.js availability check (requirement 4.5) ---
  if (typeof window.Chart === 'undefined') {
    chartAvailable = false;
    const canvas   = document.getElementById('spending-chart');
    const emptyMsg = document.getElementById('chart-empty-msg');
    canvas.style.display   = 'none';
    emptyMsg.style.display = '';
    emptyMsg.textContent   = 'Chart unavailable — please check your internet connection.';
  }

  // --- Boot the UI ---
  populateCategoryDropdown();
  render();

  // --- transaction-form submit handler (task 7.2) ---
  const form = document.getElementById('transaction-form');
  form.addEventListener('submit', handleTransactionSubmit);

  // Clear inline errors as the user types (task 7.2 / 17.3)
  document.getElementById('item-name').addEventListener('input', function () {
    document.getElementById('name-error').textContent = '';
  });
  document.getElementById('amount').addEventListener('input', function () {
    document.getElementById('amount-error').textContent = '';
  });

  // --- delete event delegation on #transaction-list (task 8) ---
  document.getElementById('transaction-list').addEventListener('click', function (event) {
    const btn = event.target.closest('.delete-btn');
    if (!btn) return;

    const id = btn.dataset.id;
    transactions = transactions.filter(function (tx) { return tx.id !== id; });
    saveTransactions();
    if (typeof render === 'function') {
      render();
    }
  });

  // --- Category Manager (task 11) ---
  document.getElementById('add-category-btn').addEventListener('click', function () {
    const input = document.getElementById('new-category');
    const errorSpan = document.getElementById('category-error');
    const name = input.value.trim();

    const result = validateCategory(name, [...BUILT_IN_CATEGORIES, ...customCategories]);

    if (!result.valid) {
      errorSpan.textContent = result.error;
      return;
    }

    // Clear any previous error
    errorSpan.textContent = '';

    // Add to state, persist, update dropdown, reset input
    customCategories.push(name);
    saveCategories();
    populateCategoryDropdown();
    input.value = '';
  });

  document.getElementById('new-category').addEventListener('input', function () {
    document.getElementById('category-error').textContent = '';
  });

  // --- Monthly Summary filtering (task 12) ---
  document.getElementById('month-filter').addEventListener('change', function (event) {
    activeMonth = event.target.value || null;
    if (typeof render === 'function') {
      render();
    }
  });

  document.getElementById('clear-month-btn').addEventListener('click', function () {
    activeMonth = null;
    document.getElementById('month-filter').value = '';
    if (typeof render === 'function') {
      render();
    }
  });

  // --- Sort control (task 13) ---
  document.getElementById('sort-select').addEventListener('change', function (event) {
    activeSort = event.target.value;
    if (typeof render === 'function') {
      render();
    }
  });

});
