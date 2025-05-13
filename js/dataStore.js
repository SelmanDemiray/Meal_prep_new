/**
 * Data Store Module
 * Handles data persistence using localStorage
 */

// Creating an immediate function to encapsulate our data store in its own scope
const DataStore = (function() {
    // Storage keys for different data types
    const STORAGE_KEYS = {
        MEALS: 'family-meal-tracker-meals', // Key for storing meal data
        MEAL_PLANS: 'family-meal-tracker-meal-plans', // Key for storing planned meals
        FAMILY_MEMBERS: 'family-meal-tracker-members', // Key for storing family member data
        BUDGET: 'family-meal-tracker-budget', // Key for storing budget data
        EXPENSES: 'family-meal-tracker-expenses', // Key for storing expense data
        FOOD_DATABASE: 'family-meal-tracker-food-db' // Key for storing food database
    };
    
    // Initial data setup for first-time use
    const initialData = {
        meals: {}, // Empty meals object
        mealPlans: {}, // Empty meal plans object
        familyMembers: [], // Empty family members array
        budget: {
            monthly: 0 // Default monthly budget
        },
        expenses: [], // Empty expenses array
        foodDatabase: [
            // Some sample foods with nutrition data
            {
                id: 1,
                name: 'Oatmeal',
                servingSize: '1 cup cooked',
                calories: 150,
                protein: 5,
                carbs: 27,
                fat: 3,
                costPerServing: 0.35, // Added cost per serving
                category: 'breakfast'
            },
            {
                id: 2,
                name: 'Chicken Breast',
                servingSize: '3 oz cooked',
                calories: 165,
                protein: 31,
                carbs: 0,
                fat: 3.5,
                costPerServing: 1.20, // Added cost per serving
                category: 'protein'
            },
            {
                id: 3,
                name: 'Broccoli',
                servingSize: '1 cup',
                calories: 55,
                protein: 3.7,
                carbs: 11,
                fat: 0.6,
                costPerServing: 0.60, // Added cost per serving
                category: 'vegetable'
            },
            // Add more sample foods as needed
        ]
    };
    
    // Function to safely get data from localStorage with error handling
    function getData(key) {
        try {
            // Get data from localStorage
            const data = localStorage.getItem(key);
            // If data exists, parse it; otherwise return null
            return data ? JSON.parse(data) : null;
        } catch (error) {
            // Handle storage or parsing errors
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.DATA_PARSE_ERROR,
                `Failed to get data for key: ${key}`,
                error.message
            );
            return null;
        }
    }
    
    // Function to safely save data to localStorage with error handling
    function saveData(key, data) {
        try {
            // Convert data to JSON string and save to localStorage
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            // Handle storage errors
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.DATA_STORAGE_ERROR,
                `Failed to save data for key: ${key}`,
                error.message
            );
            return false;
        }
    }
    
    // Initialize storage with default data if needed
    function initializeStorage() {
        // For each data type, check if it exists and initialize if not
        if (!getData(STORAGE_KEYS.MEALS)) {
            saveData(STORAGE_KEYS.MEALS, initialData.meals);
        }
        
        if (!getData(STORAGE_KEYS.MEAL_PLANS)) {
            saveData(STORAGE_KEYS.MEAL_PLANS, initialData.mealPlans);
        }
        
        if (!getData(STORAGE_KEYS.FAMILY_MEMBERS)) {
            saveData(STORAGE_KEYS.FAMILY_MEMBERS, initialData.familyMembers);
        }
        
        if (!getData(STORAGE_KEYS.BUDGET)) {
            saveData(STORAGE_KEYS.BUDGET, initialData.budget);
        }
        
        if (!getData(STORAGE_KEYS.EXPENSES)) {
            saveData(STORAGE_KEYS.EXPENSES, initialData.expenses);
        }
        
        if (!getData(STORAGE_KEYS.FOOD_DATABASE)) {
            saveData(STORAGE_KEYS.FOOD_DATABASE, initialData.foodDatabase);
        }
    }
    
    // Get meals for a specific date and family member
    function getMeals(date, familyMemberId) {
        // Get all meals data
        const allMeals = getData(STORAGE_KEYS.MEALS) || {};
        // Create unique key for the date and family member
        const key = `${date}_${familyMemberId}`;
        // Return meals for this key or empty object if none exist
        return allMeals[key] || {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
        };
    }
    
    // Save meals for a specific date and family member
    function saveMeals(date, familyMemberId, meals) {
        // Get all existing meals
        const allMeals = getData(STORAGE_KEYS.MEALS) || {};
        // Create unique key for the date and family member
        const key = `${date}_${familyMemberId}`;
        // Update meals for this key
        allMeals[key] = meals;
        // Save all meals back to storage
        return saveData(STORAGE_KEYS.MEALS, allMeals);
    }
    
    // Get planned meals for a specific date and family member
    function getMealPlans(date, familyMemberId) {
        // Get all meal plans data
        const allMealPlans = getData(STORAGE_KEYS.MEAL_PLANS) || {};
        // Create unique key for the date and family member
        const key = `${date}_${familyMemberId}`;
        // Return meal plans for this key or empty object if none exist
        return allMealPlans[key] || {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
        };
    }
    
    // Save meal plans for a specific date and family member
    function saveMealPlans(date, familyMemberId, mealPlans) {
        // Get all existing meal plans
        const allMealPlans = getData(STORAGE_KEYS.MEAL_PLANS) || {};
        // Create unique key for the date and family member
        const key = `${date}_${familyMemberId}`;
        // Update meal plans for this key
        allMealPlans[key] = mealPlans;
        // Save all meal plans back to storage
        return saveData(STORAGE_KEYS.MEAL_PLANS, allMealPlans);
    }
    
    // Get all meal costs for a date range
    function getMealCostsForDateRange(startDate, endDate, familyMemberId = null) {
        const allMeals = getData(STORAGE_KEYS.MEALS) || {};
        const foodDb = getFoodDatabase();
        const costs = [];
        
        // Convert dates to comparable format
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Iterate through all meal entries
        for (const key in allMeals) {
            const [date, memberId] = key.split('_');
            const mealDate = new Date(date);
            
            // Check if the date is in range and matches the family member (if specified)
            if (mealDate >= start && mealDate <= end && (!familyMemberId || memberId === familyMemberId)) {
                const dayMeals = allMeals[key];
                let dayCost = 0;
                
                // Calculate cost for each meal type
                ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
                    if (dayMeals[mealType] && dayMeals[mealType].length > 0) {
                        dayMeals[mealType].forEach(item => {
                            const food = foodDb.find(f => f.id.toString() === item.foodId.toString());
                            if (food && food.costPerServing) {
                                dayCost += food.costPerServing * (parseFloat(item.servings) || 1);
                            }
                        });
                    }
                });
                
                costs.push({
                    date,
                    memberId,
                    cost: dayCost
                });
            }
        }
        
        return costs;
    }
    
    // Convert a meal plan to consumed meal
    function convertPlanToMeal(date, familyMemberId, mealType, planIndex) {
        try {
            // Get the meal plan
            const mealPlans = getMealPlans(date, familyMemberId);
            if (!mealPlans[mealType] || !mealPlans[mealType][planIndex]) {
                return false;
            }
            
            // Get the specific meal plan item
            const planItem = mealPlans[mealType][planIndex];
            
            // Get current consumed meals
            const meals = getMeals(date, familyMemberId);
            
            // Ensure the meal type array exists
            if (!meals[mealType]) {
                meals[mealType] = [];
            }
            
            // Add plan item to consumed meals with consumed status
            meals[mealType].push({
                foodId: planItem.foodId,
                servings: planItem.servings,
                notes: planItem.notes,
                timestamp: Date.now(),
                planned: true, // Flag that this was from a plan
                consumedAt: Date.now() // When it was marked as consumed
            });
            
            // Save the updated meals
            saveMeals(date, familyMemberId, meals);
            
            // Remove the item from meal plans
            mealPlans[mealType].splice(planIndex, 1);
            saveMealPlans(date, familyMemberId, mealPlans);
            
            return true;
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.DATA_STORAGE_ERROR,
                'Failed to convert meal plan to consumed meal',
                error.message
            );
            return false;
        }
    }
    
    // Get all family members
    function getFamilyMembers() {
        return getData(STORAGE_KEYS.FAMILY_MEMBERS) || [];
    }
    
    // Add a new family member
    function addFamilyMember(name, age, weight, height, activityLevel) {
        // Get current family members
        const members = getFamilyMembers();
        // Create new member object with unique ID
        const newMember = {
            id: Date.now().toString(), // Use timestamp as unique ID
            name,
            age,
            weight,
            height,
            activityLevel
        };
        // Add to array and save
        members.push(newMember);
        return saveFamilyMembers(members) ? newMember : null;
    }
    
    // Save all family members
    function saveFamilyMembers(familyMembers) {
        return saveData(STORAGE_KEYS.FAMILY_MEMBERS, familyMembers);
    }
    
    // Get budget information
    function getBudget() {
        return getData(STORAGE_KEYS.BUDGET) || initialData.budget;
    }
    
    // Update budget amount
    function updateBudget(amount) {
        const budget = getBudget();
        budget.monthly = amount;
        return saveData(STORAGE_KEYS.BUDGET, budget);
    }
    
    // Get all expenses
    function getExpenses() {
        return getData(STORAGE_KEYS.EXPENSES) || [];
    }
    
    // Add a new expense
    function addExpense(date, description, amount) {
        const expenses = getExpenses();
        const newExpense = {
            id: Date.now().toString(), // Use timestamp as unique ID
            date,
            description,
            amount
        };
        expenses.push(newExpense);
        return saveData(STORAGE_KEYS.EXPENSES, expenses) ? newExpense : null;
    }
    
    // Delete an expense
    function deleteExpense(expenseId) {
        const expenses = getExpenses();
        const updatedExpenses = expenses.filter(expense => expense.id !== expenseId);
        return saveData(STORAGE_KEYS.EXPENSES, updatedExpenses);
    }
    
    // Get food database
    function getFoodDatabase() {
        return getData(STORAGE_KEYS.FOOD_DATABASE) || [];
    }
    
    // Add food to database
    function addFoodToDatabase(food) {
        const foodDb = getFoodDatabase();
        const newFood = {
            id: Date.now().toString(), // Use timestamp as unique ID
            ...food
        };
        foodDb.push(newFood);
        return saveData(STORAGE_KEYS.FOOD_DATABASE, foodDb) ? newFood : null;
    }
    
    // Find food by ID
    function getFoodById(foodId) {
        const foodDb = getFoodDatabase();
        return foodDb.find(food => food.id === foodId);
    }
    
    // Reset all data (for development or user reset request)
    function resetAllData() {
        try {
            // Remove all stored data
            localStorage.removeItem(STORAGE_KEYS.MEALS);
            localStorage.removeItem(STORAGE_KEYS.MEAL_PLANS);
            localStorage.removeItem(STORAGE_KEYS.FAMILY_MEMBERS);
            localStorage.removeItem(STORAGE_KEYS.BUDGET);
            localStorage.removeItem(STORAGE_KEYS.EXPENSES);
            localStorage.removeItem(STORAGE_KEYS.FOOD_DATABASE);
            
            // Re-initialize with default data
            initializeStorage();
            return true;
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.DATA_STORAGE_ERROR,
                'Failed to reset data',
                error.message
            );
            return false;
        }
    }
    
    // Public API
    return {
        initializeStorage,
        getMeals,
        saveMeals,
        getMealPlans,
        saveMealPlans,
        convertPlanToMeal,
        getMealCostsForDateRange,
        getFamilyMembers,
        addFamilyMember,
        saveFamilyMembers,
        getBudget,
        updateBudget,
        getExpenses,
        addExpense,
        deleteExpense,
        getFoodDatabase,
        addFoodToDatabase,
        getFoodById,
        resetAllData
    };
})();
