/**
 * Budget Tracker Module
 * Handles budget tracking, expenses, and financial calculations
 */

const BudgetTracker = (function() {
    // Current state
    let currentMonth = new Date().toISOString().slice(0, 7); // Current month in YYYY-MM format
    let expenses = []; // All expenses
    let monthlyBudget = 0; // Monthly budget amount
    
    /**
     * Initialize the budget tracker
     */
    function initialize() {
        try {
            // Load budget data
            loadBudgetData();
            
            // Set up month selector
            const budgetMonth = document.getElementById('budget-month');
            if (budgetMonth) {
                budgetMonth.value = currentMonth;
                
                // Add event listener for month change
                budgetMonth.addEventListener('change', function() {
                    currentMonth = this.value;
                    renderExpenses();
                    updateBudgetSummary();
                });
            }
            
            // Set up budget update button
            const updateBudgetBtn = document.getElementById('update-budget');
            if (updateBudgetBtn) {
                updateBudgetBtn.addEventListener('click', function() {
                    const budgetInput = document.getElementById('monthly-budget');
                    if (budgetInput) {
                        updateBudget(parseFloat(budgetInput.value));
                    }
                });
            }
            
            // Set up add expense button
            const addExpenseBtn = document.getElementById('add-expense');
            if (addExpenseBtn) {
                addExpenseBtn.addEventListener('click', showAddExpenseModal);
            }
            
            // Render initial data
            renderExpenses();
            updateBudgetSummary();
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_INTERACTION_ERROR,
                "Failed to initialize budget tracker",
                error.message
            );
        }
    }
    
    /**
     * Load budget and expense data from storage
     */
    function loadBudgetData() {
        try {
            // Get budget data
            const budget = DataStore.getBudget();
            monthlyBudget = budget.monthly;
            
            // Update budget input
            const budgetInput = document.getElementById('monthly-budget');
            if (budgetInput) {
                budgetInput.value = monthlyBudget;
            }
            
            // Get expenses
            expenses = DataStore.getExpenses();
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.DATA_NOT_FOUND,
                "Failed to load budget data",
                error.message
            );
        }
    }
    
    /**
     * Update the monthly budget
     * @param {number} amount - New budget amount
     */
    function updateBudget(amount) {
        try {
            // Update budget in storage
            monthlyBudget = amount;
            DataStore.updateBudget(amount);
            
            // Update UI
            updateBudgetSummary();
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.BUDGET_UPDATE_ERROR,
                "Failed to update budget",
                error.message
            );
        }
    }
    
    /**
     * Show modal for adding a new expense
     */
    function showAddExpenseModal() {
        try {
            const modalOverlay = document.getElementById('modal-overlay');
            const expenseModal = document.getElementById('add-expense-modal');
            
            if (!modalOverlay || !expenseModal) return;
            
            // Set default date to today
            const today = new Date().toISOString().split('T')[0];
            
            // Create modal content
            expenseModal.innerHTML = `
                <h3>Add New Expense</h3>
                <form id="add-expense-form" class="modal-form">
                    <div>
                        <label for="expense-date">Date:</label>
                        <input type="date" id="expense-date" value="${today}" required>
                    </div>
                    <div>
                        <label for="expense-description">Description:</label>
                        <input type="text" id="expense-description" placeholder="Grocery shopping" required>
                    </div>
                    <div>
                        <label for="expense-amount">Amount ($):</label>
                        <input type="number" id="expense-amount" min="0.01" step="0.01" required>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" id="cancel-add-expense">Cancel</button>
                        <button type="submit">Add Expense</button>
                    </div>
                </form>
            `;
            
            // Show the modal
            modalOverlay.classList.remove('hidden');
            expenseModal.classList.remove('hidden');
            
            // Set up event listeners
            document.getElementById('cancel-add-expense').addEventListener('click', closeModal);
            document.getElementById('add-expense-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const date = document.getElementById('expense-date').value;
                const description = document.getElementById('expense-description').value;
                const amount = parseFloat(document.getElementById('expense-amount').value);
                
                addExpense(date, description, amount);
                closeModal();
            });
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_RENDER_ERROR,
                "Failed to show add expense modal",
                error.message
            );
        }
    }
    
    /**
     * Close any open modal
     */
    function closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            // Hide all modals
            modalOverlay.classList.add('hidden');
            
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    }
    
    /**
     * Add a new expense
     * @param {string} date - Expense date
     * @param {string} description - Expense description
     * @param {number} amount - Expense amount
     */
    function addExpense(date, description, amount) {
        try {
            // Add expense to storage
            const newExpense = DataStore.addExpense(date, description, amount);
            
            if (newExpense) {
                // Refresh expense list
                expenses = DataStore.getExpenses();
                renderExpenses();
                updateBudgetSummary();
            }
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.BUDGET_ADD_ERROR,
                "Failed to add expense",
                error.message
            );
        }
    }
    
    /**
     * Delete an expense
     * @param {string} expenseId - ID of expense to delete
     */
    function deleteExpense(expenseId) {
        try {
            // Delete expense from storage
            const success = DataStore.deleteExpense(expenseId);
            
            if (success) {
                // Refresh expense list
                expenses = DataStore.getExpenses();
                renderExpenses();
                updateBudgetSummary();
            }
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.BUDGET_DELETE_ERROR,
                "Failed to delete expense",
                error.message
            );
        }
    }
    
    /**
     * Render expenses for the selected month
     */
    function renderExpenses() {
        try {
            const expensesBody = document.getElementById('expenses-body');
            if (!expensesBody) return;
            
            // Clear existing content
            expensesBody.innerHTML = '';
            
            // Filter expenses for the current month
            const filteredExpenses = expenses.filter(expense => {
                return expense.date.startsWith(currentMonth);
            });
            
            if (filteredExpenses.length > 0) {
                // Sort expenses by date
                filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Render each expense
                filteredExpenses.forEach(expense => {
                    const row = document.createElement('tr');
                    
                    // Format date for display
                    const dateObj = new Date(expense.date);
                    const formattedDate = dateObj.toLocaleDateString();
                    
                    row.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${expense.description}</td>
                        <td>$${parseFloat(expense.amount).toFixed(2)}</td>
                        <td>
                            <button class="delete-expense" data-expense-id="${expense.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    // Add to table
                    expensesBody.appendChild(row);
                    
                    // Add event listener to delete button
                    const deleteBtn = row.querySelector('.delete-expense');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', function() {
                            const expenseId = this.getAttribute('data-expense-id');
                            deleteExpense(expenseId);
                        });
                    }
                });
            } else {
                // Show empty state
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="4" class="empty-state">No expenses recorded for this month.</td>
                `;
                expensesBody.appendChild(row);
            }
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_RENDER_ERROR,
                "Failed to render expenses",
                error.message
            );
        }
    }
    
    /**
     * Calculate total expenses for the current month
     * @returns {number} Total expenses
     */
    function calculateMonthlyExpenses() {
        try {
            // Filter expenses for current month
            const monthExpenses = expenses.filter(expense => {
                return expense.date.startsWith(currentMonth);
            });
            
            // Sum up all expenses
            return monthExpenses.reduce((total, expense) => {
                return total + parseFloat(expense.amount);
            }, 0);
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.DATA_PARSE_ERROR,
                "Failed to calculate monthly expenses",
                error.message
            );
            return 0;
        }
    }
    
    /**
     * Calculate daily average spending including meal costs
     * @param {number} totalSpent - Total amount already spent
     * @returns {number} Daily average
     */
    function calculateDailyAverage(totalSpent) {
        try {
            // Get number of days passed in month
            const now = new Date();
            const year = parseInt(currentMonth.split('-')[0]);
            const month = parseInt(currentMonth.split('-')[1]) - 1; // JS months are 0-based
            
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            // If it's the current month, use days passed so far
            let daysPassed;
            if (year === now.getFullYear() && month === now.getMonth()) {
                daysPassed = now.getDate();
            } else {
                daysPassed = daysInMonth;
            }
            
            return totalSpent / daysPassed;
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.DATA_PARSE_ERROR,
                "Failed to calculate daily average",
                error.message
            );
            return 0;
        }
    }
    
    /**
     * Calculate estimated end-of-month total based on current spending
     * @param {number} totalSpent - Total amount already spent
     * @returns {number} Estimated total
     */
    function calculateEstimatedTotal(totalSpent) {
        try {
            // Get days passed and total days in month
            const now = new Date();
            const year = parseInt(currentMonth.split('-')[0]);
            const month = parseInt(currentMonth.split('-')[1]) - 1; // JS months are 0-based
            
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            // If it's not the current month, just return actual total
            if (year !== now.getFullYear() || month !== now.getMonth()) {
                return totalSpent;
            }
            
            const daysPassed = now.getDate();
            const dailyAverage = totalSpent / daysPassed;
            
            return totalSpent + (dailyAverage * (daysInMonth - daysPassed));
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.DATA_PARSE_ERROR,
                "Failed to calculate estimated total",
                error.message
            );
            return 0;
        }
    }
    
    /**
     * Calculate monthly costs from tracked meals
     * @returns {number} Total meal costs for the month
     */
    function calculateMonthlyMealCosts() {
        try {
            // Parse month components
            const year = parseInt(currentMonth.split('-')[0]);
            const month = parseInt(currentMonth.split('-')[1]);
            
            // Format dates for range
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
            
            // Get meal costs for the date range (across all family members)
            const mealCosts = DataStore.getMealCostsForDateRange(startDate, endDate);
            
            // Sum up all meal costs
            return mealCosts.reduce((total, item) => total + item.cost, 0);
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.DATA_PARSE_ERROR,
                "Failed to calculate monthly meal costs",
                error.message
            );
            return 0;
        }
    }
    
    /**
     * Display per-family-member meal cost breakdown
     */
    function displayFamilyMemberCosts() {
        try {
            const container = document.getElementById('family-member-costs');
            if (!container) return;
            
            // Get all family members
            const familyMembers = DataStore.getFamilyMembers();
            
            // Parse month components
            const year = parseInt(currentMonth.split('-')[0]);
            const month = parseInt(currentMonth.split('-')[1]);
            
            // Format dates for range
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
            
            // Generate array to hold member costs
            const memberCosts = [];
            
            // Calculate costs for each member
            familyMembers.forEach(member => {
                const costs = DataStore.getMealCostsForDateRange(startDate, endDate, member.id);
                const totalCost = costs.reduce((total, item) => total + item.cost, 0);
                memberCosts.push({
                    name: member.name,
                    cost: totalCost
                });
            });
            
            // Sort by cost (highest first)
            memberCosts.sort((a, b) => b.cost - a.cost);
            
            // Generate HTML
            let html = '<h4>Cost by Family Member</h4>';
            html += '<div class="member-costs-grid">';
            
            memberCosts.forEach(member => {
                html += `
                    <div class="cost-item">
                        <span class="cost-label">${member.name}:</span>
                        <span class="cost-value">$${member.cost.toFixed(2)}</span>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_RENDER_ERROR,
                "Failed to display family member costs",
                error.message
            );
        }
    }
    
    /**
     * Update the budget summary display
     */
    function updateBudgetSummary() {
        try {
            const summaryEl = document.getElementById('budget-summary-content');
            if (!summaryEl) return;
            
            // Calculate budget metrics
            const totalExpenses = calculateMonthlyExpenses();
            
            // Calculate automatic meal expenses from tracked meals
            const mealCosts = calculateMonthlyMealCosts();
            
            // Total expenses including tracked meals
            const combinedExpenses = totalExpenses + mealCosts;
            
            const remainingBudget = monthlyBudget - combinedExpenses;
            const dailyAverage = calculateDailyAverage(combinedExpenses);
            const estimatedTotal = calculateEstimatedTotal(combinedExpenses);
            const projectedRemaining = monthlyBudget - estimatedTotal;
            
            // Get percentages for progress bars
            const spentPercentage = Math.min((combinedExpenses / monthlyBudget) * 100, 100) || 0;
            const projectedPercentage = Math.min((estimatedTotal / monthlyBudget) * 100, 100) || 0;
            
            // Create the HTML for the budget summary
            let summaryHTML = `
                <div class="budget-metrics">
                    <div class="metric">
                        <h4>Monthly Budget</h4>
                        <span class="amount">$${monthlyBudget.toFixed(2)}</span>
                    </div>
                    <div class="metric">
                        <h4>Manual Expenses</h4>
                        <span class="amount">$${totalExpenses.toFixed(2)}</span>
                    </div>
                    <div class="metric">
                        <h4>Meal Costs</h4>
                        <span class="amount">$${mealCosts.toFixed(2)}</span>
                    </div>
                    <div class="metric">
                        <h4>Total Spent</h4>
                        <span class="amount">$${combinedExpenses.toFixed(2)}</span>
                    </div>
                    <div class="metric">
                        <h4>Remaining</h4>
                        <span class="amount ${remainingBudget < 0 ? 'negative' : ''}">$${remainingBudget.toFixed(2)}</span>
                    </div>
                    <div class="metric">
                        <h4>Daily Average</h4>
                        <span class="amount">$${dailyAverage.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="budget-progress">
                    <h4>Current Spending</h4>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress ${spentPercentage > 100 ? 'over-budget' : ''}" style="width: ${spentPercentage}%"></div>
                        </div>
                        <div class="progress-labels">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                    <p class="progress-info">You've spent ${spentPercentage.toFixed(1)}% of your monthly budget</p>
                </div>
                
                <div class="budget-projection">
                    <h4>Month-End Projection</h4>
                    <p class="projection-info">
                        Based on your current spending, you are estimated to spend
                        <strong>$${estimatedTotal.toFixed(2)}</strong> this month.
                    </p>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress ${projectedPercentage > 100 ? 'over-budget' : ''}" style="width: ${projectedPercentage}%"></div>
                        </div>
                        <div class="progress-labels">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                    <p class="progress-info ${projectedRemaining < 0 ? 'negative' : ''}">
                        Projected remaining: $${projectedRemaining.toFixed(2)}
                    </p>
                </div>
                
                <div class="meals-cost-breakdown">
                    <h4>Meal Cost Analysis</h4>
                    <p>Average cost per meal based on recorded meal data:</p>
                    <div id="meal-costs">
                        <!-- Will be populated with meal cost analysis -->
                    </div>
                    <div id="family-member-costs">
                        <!-- Will be populated with per-member cost analysis -->
                    </div>
                </div>
            `;
            
            summaryEl.innerHTML = summaryHTML;
            
            // After rendering, calculate and display meal costs
            calculateAndDisplayMealCosts();
            
            // Also display per-family-member costs
            displayFamilyMemberCosts();
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_RENDER_ERROR,
                "Failed to update budget summary",
                error.message
            );
        }
    }
    
    // Public API
    return {
        initialize,
        loadBudgetData,
        updateBudget,
        renderExpenses,
        updateBudgetSummary
    };
})();
