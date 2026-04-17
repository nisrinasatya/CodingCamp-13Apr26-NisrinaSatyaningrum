# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application built with HTML, CSS, and vanilla JavaScript. It allows users to track personal expenses by category, view a running total balance, visualize spending distribution through a pie chart, and manage transactions through a clean, beginner-friendly interface. All data is persisted in the browser's Local Storage — no backend or server is required. The app targets a single-file-per-concern structure (index.html, style.css, script.js) and is designed to be mobile-friendly with a soft pastel aesthetic.

---

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single expense entry consisting of an item name, amount, and category.
- **Transaction_List**: The scrollable UI component that displays all recorded transactions.
- **Input_Form**: The UI form used to enter a new transaction's item name, amount, and category.
- **Category**: A label assigned to a transaction (e.g., Food, Transport, Fun, Hygiene, Skincare, Makeup, or a user-defined custom category).
- **Category_Manager**: The component responsible for managing the list of available categories, including built-in and custom ones.
- **Balance_Display**: The UI element at the top of the page that shows the current total of all transaction amounts.
- **Chart**: The pie chart that visualizes spending distribution by category.
- **Monthly_Summary**: A filtered view showing transactions and totals for a selected month.
- **Storage**: The browser's Local Storage API used to persist all app data.
- **Validator**: The component that checks Input_Form fields before a transaction is submitted.

---

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to fill in a form with an item name, amount, and category, so that I can record a new expense.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for item name, a numeric field for amount, and a dropdown for category.
2. THE Input_Form SHALL populate the category dropdown with all built-in categories (Food, Transport, Fun, Hygiene, Skincare, Makeup) and any user-defined custom categories.
3. WHEN the user submits the Input_Form with all fields filled and a valid positive amount, THE App SHALL add the transaction to the Transaction_List.
4. WHEN the user submits the Input_Form with all fields filled and a valid positive amount, THE App SHALL persist the transaction to Storage.
5. IF the user submits the Input_Form with one or more empty fields, THEN THE Validator SHALL display an inline error message identifying the missing field(s) and prevent submission.
6. IF the user submits the Input_Form with an amount that is not a positive number, THEN THE Validator SHALL display an inline error message and prevent submission.
7. WHEN a transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty state.

---

### Requirement 2: View and Delete Transactions

**User Story:** As a user, I want to see all my recorded expenses in a list and remove ones I no longer need, so that I can keep my records accurate.

#### Acceptance Criteria

1. THE Transaction_List SHALL display each transaction's item name, amount, and category.
2. THE Transaction_List SHALL be scrollable when the number of transactions exceeds the visible area.
3. THE Transaction_List SHALL display transactions in the order they were added, most recent first.
4. WHEN the user clicks the delete button on a transaction, THE App SHALL remove that transaction from the Transaction_List.
5. WHEN the user clicks the delete button on a transaction, THE App SHALL remove that transaction from Storage.

---

### Requirement 3: Display Total Balance

**User Story:** As a user, I want to see my total spending at a glance, so that I know how much I have spent overall.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all transaction amounts at the top of the page.
2. WHEN a transaction is added, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
3. WHEN a transaction is deleted, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
4. THE Balance_Display SHALL format the total as a currency value with two decimal places.

---

### Requirement 4: Visualize Spending by Category

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL display a pie chart where each slice represents a category and its size is proportional to the total amount spent in that category.
2. WHEN a transaction is added, THE Chart SHALL update automatically to reflect the new spending distribution.
3. WHEN a transaction is deleted, THE Chart SHALL update automatically to reflect the updated spending distribution.
4. THE Chart SHALL display a legend identifying each category and its corresponding color.
5. WHEN no transactions exist, THE Chart SHALL display a placeholder message indicating there is no data to show.

---

### Requirement 5: Manage Custom Categories

**User Story:** As a user, I want to add my own spending categories, so that I can track expenses that don't fit the default options.

#### Acceptance Criteria

1. THE Category_Manager SHALL provide an input field and a button that allow the user to add a new custom category.
2. WHEN the user submits a non-empty category name that does not already exist, THE Category_Manager SHALL add the new category to the category dropdown in the Input_Form.
3. WHEN the user submits a non-empty category name that does not already exist, THE Category_Manager SHALL persist the custom category list to Storage.
4. IF the user submits an empty category name, THEN THE Category_Manager SHALL display an inline error message and prevent the addition.
5. IF the user submits a category name that already exists (case-insensitive), THEN THE Category_Manager SHALL display an inline error message and prevent the addition.
6. WHEN the App loads, THE Category_Manager SHALL restore all previously saved custom categories from Storage.

---

### Requirement 6: Monthly Summary View

**User Story:** As a user, I want to filter my transactions by month, so that I can review my spending for a specific time period.

#### Acceptance Criteria

1. THE Monthly_Summary SHALL provide a month/year selector that allows the user to choose a specific month.
2. WHEN the user selects a month, THE Monthly_Summary SHALL display only the transactions recorded in that month.
3. WHEN the user selects a month, THE Monthly_Summary SHALL display the total amount spent in that month.
4. WHEN the user selects a month, THE Chart SHALL update to reflect the spending distribution for that month only.
5. WHEN the user clears the month selection, THE App SHALL return to displaying all transactions and the full spending distribution.

---

### Requirement 7: Sort Transactions

**User Story:** As a user, I want to sort my transaction list by amount or category, so that I can find and review entries more easily.

#### Acceptance Criteria

1. THE Transaction_List SHALL provide a sort control with options to sort by amount (ascending and descending) and by category (A–Z and Z–A).
2. WHEN the user selects a sort option, THE Transaction_List SHALL reorder the displayed transactions accordingly without modifying the underlying stored data.
3. WHEN a new transaction is added while a sort option is active, THE Transaction_List SHALL display the updated list in the currently selected sort order.
4. WHEN the user selects the default sort option, THE Transaction_List SHALL display transactions in the order they were added, most recent first.

---

### Requirement 8: Persist and Restore App State

**User Story:** As a user, I want my data to be saved automatically, so that my transactions and categories are still available when I reopen the app.

#### Acceptance Criteria

1. THE App SHALL save all transactions to Storage whenever a transaction is added or deleted.
2. THE App SHALL save all custom categories to Storage whenever a custom category is added.
3. WHEN the App loads, THE App SHALL read all transactions from Storage and populate the Transaction_List.
4. WHEN the App loads, THE App SHALL read all custom categories from Storage and populate the category dropdown.
5. WHEN the App loads with no data in Storage, THE App SHALL display an empty Transaction_List and the default set of categories.

---

### Requirement 9: Responsive and Accessible Layout

**User Story:** As a user, I want the app to work well on both desktop and mobile screens, so that I can track expenses from any device.

#### Acceptance Criteria

1. THE App SHALL render a usable layout on screen widths from 320px to 1920px.
2. THE App SHALL use a Google Font for all body text to ensure readable typography.
3. THE App SHALL apply a soft pastel color palette consistently across all UI components.
4. THE App SHALL provide sufficient color contrast between text and background to remain readable.
5. THE App SHALL use semantic HTML elements to support screen reader accessibility.
