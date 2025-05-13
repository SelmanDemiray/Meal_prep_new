/**
 * Nutrition Calculator Module
 * Handles all nutrition calculations and metadata tracking for meals
 */

const NutritionCalculator = (function() {
    // Macronutrient calorie values
    const CALORIES_PER_GRAM = {
        PROTEIN: 4, // Proteins contain 4 calories per gram
        CARBS: 4, // Carbohydrates contain 4 calories per gram
        FAT: 9, // Fats contain 9 calories per gram
        FIBER: 2 // Fiber has approximately 2 calories per gram
    };
    
    // Daily recommended values based on FDA guidelines
    const DAILY_RECOMMENDED = {
        CALORIES: {
            // Base values to be adjusted by age, weight, height, and activity level
            ADULT_MALE: 2500, // Average for adult males
            ADULT_FEMALE: 2000, // Average for adult females
            CHILD: 1800 // Average for children 9-13
        },
        MACROS: {
            PROTEIN_PERCENT: 0.15, // 15% of daily calories
            CARBS_PERCENT: 0.55, // 55% of daily calories
            FAT_PERCENT: 0.30 // 30% of daily calories
        },
        MICROS: {
            FIBER: 25, // 25g per day
            SODIUM: 2300, // 2300mg per day
            CALCIUM: 1000, // 1000mg per day
            IRON: 18, // 18mg per day
            VITAMIN_A: 900, // 900mcg per day
            VITAMIN_C: 90 // 90mg per day
        }
    };
    
    // Activity level multipliers for calorie needs
    const ACTIVITY_MULTIPLIERS = {
        SEDENTARY: 1.2, // Little or no exercise
        LIGHT: 1.375, // Light exercise/sports 1-3 days/week
        MODERATE: 1.55, // Moderate exercise/sports 3-5 days/week
        ACTIVE: 1.725, // Hard exercise/sports 6-7 days/week
        VERY_ACTIVE: 1.9 // Very hard exercise & physical job or training twice a day
    };
    
    /**
     * Calculate Basal Metabolic Rate using the Harris-Benedict formula
     * @param {Object} person - Person object with gender, weight (kg), height (cm), and age
     * @returns {number} BMR in calories
     */
    function calculateBMR(person) {
        try {
            // Check if we have all required parameters
            if (!person || !person.gender || !person.weight || !person.height || !person.age) {
                throw new Error("Missing required person data for BMR calculation");
            }
            
            // Convert weight from lb to kg and height from in to cm if needed
            const weight = person.weightUnit === 'lb' ? person.weight * 0.453592 : person.weight;
            const height = person.heightUnit === 'in' ? person.height * 2.54 : person.height;
            
            let bmr = 0;
            
            // Harris-Benedict formula with gender differences
            if (person.gender.toLowerCase() === 'male') {
                // BMR = 88.362 + (13.397 × weight in kg) + (4.799 × height in cm) - (5.677 × age in years)
                bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * person.age);
            } else {
                // BMR = 447.593 + (9.247 × weight in kg) + (3.098 × height in cm) - (4.330 × age in years)
                bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * person.age);
            }
            
            return Math.round(bmr);
        } catch (error) {
            // Handle error in BMR calculation
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.NUTRITION_CALC_ERROR,
                "Error calculating BMR",
                error.message
            );
            return 0;
        }
    }
    
    /**
     * Calculate total daily energy expenditure
     * @param {number} bmr - Basal metabolic rate
     * @param {string} activityLevel - Activity level (SEDENTARY, LIGHT, MODERATE, ACTIVE, VERY_ACTIVE)
     * @returns {number} TDEE in calories
     */
    function calculateTDEE(bmr, activityLevel) {
        try {
            const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.MODERATE;
            return Math.round(bmr * multiplier);
        } catch (error) {
            // Handle error in TDEE calculation
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.NUTRITION_CALC_ERROR,
                "Error calculating TDEE",
                error.message
            );
            return 0;
        }
    }
    
    /**
     * Calculate daily calorie needs for a person
     * @param {Object} person - Person object with gender, weight, height, age, and activityLevel
     * @returns {number} Daily calorie needs
     */
    function calculateDailyCalorieNeeds(person) {
        try {
            const bmr = calculateBMR(person);
            return calculateTDEE(bmr, person.activityLevel);
        } catch (error) {
            // Handle error in calorie needs calculation
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.NUTRITION_CALC_ERROR,
                "Error calculating daily calorie needs",
                error.message
            );
            return 2000; // Return default value
        }
    }
    
    /**
     * Calculate nutrition totals for a meal
     * @param {Array} mealItems - Array of meal items with food and servings
     * @param {Array} foodDatabase - Database of foods with nutrition information
     * @returns {Object} Total nutrition values
     */
    function calculateMealNutrition(mealItems, foodDatabase) {
        try {
            // Initialize nutrition totals
            const totals = {
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0,
                sodium: 0,
                calcium: 0,
                iron: 0,
                vitaminA: 0,
                vitaminC: 0,
                cost: 0 // Track cost if available
            };
            
            // If no meal items, return zeros
            if (!mealItems || !mealItems.length) {
                return totals;
            }
            
            // Calculate total nutrition values
            mealItems.forEach(item => {
                // Find the food in the database
                const food = foodDatabase.find(f => f.id.toString() === item.foodId.toString());
                
                if (food) {
                    // Calculate servings
                    const servings = parseFloat(item.servings) || 1;
                    
                    // Add to totals, multiplying by servings
                    totals.calories += (food.calories * servings);
                    totals.protein += (food.protein * servings);
                    totals.carbs += (food.carbs * servings);
                    totals.fat += (food.fat * servings);
                    
                    // Optional nutrition values that may not exist in all foods
                    if (food.fiber) totals.fiber += (food.fiber * servings);
                    if (food.sodium) totals.sodium += (food.sodium * servings);
                    if (food.calcium) totals.calcium += (food.calcium * servings);
                    if (food.iron) totals.iron += (food.iron * servings);
                    if (food.vitaminA) totals.vitaminA += (food.vitaminA * servings);
                    if (food.vitaminC) totals.vitaminC += (food.vitaminC * servings);
                    
                    // Add cost if available
                    if (food.costPerServing) {
                        totals.cost += (food.costPerServing * servings);
                    }
                }
            });
            
            // Round numbers for better display
            Object.keys(totals).forEach(key => {
                if (typeof totals[key] === 'number') {
                    totals[key] = Math.round(totals[key] * 10) / 10;
                }
            });
            
            return totals;
        } catch (error) {
            // Handle error in meal nutrition calculation
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.NUTRITION_CALC_ERROR,
                "Error calculating meal nutrition",
                error.message
            );
            return {
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0,
                cost: 0
            };
        }
    }
    
    /**
     * Calculate daily nutrition totals across all meals
     * @param {Object} meals - Object containing breakfast, lunch, dinner, and snacks
     * @param {Array} foodDatabase - Database of foods with nutrition information
     * @returns {Object} Daily nutrition totals
     */
    function calculateDailyNutrition(meals, foodDatabase) {
        try {
            // Initialize daily totals using the same structure as meal nutrition
            const dailyTotals = {
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0,
                sodium: 0,
                calcium: 0,
                iron: 0,
                vitaminA: 0,
                vitaminC: 0,
                cost: 0
            };
            
            // Calculate nutrition for each meal type and add to daily totals
            const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
            
            mealTypes.forEach(mealType => {
                if (meals[mealType] && Array.isArray(meals[mealType])) {
                    // Calculate nutrition for this meal
                    const mealNutrition = calculateMealNutrition(meals[mealType], foodDatabase);
                    
                    // Add to daily totals
                    Object.keys(dailyTotals).forEach(key => {
                        dailyTotals[key] += mealNutrition[key] || 0;
                    });
                }
            });
            
            // Round values for better display
            Object.keys(dailyTotals).forEach(key => {
                if (typeof dailyTotals[key] === 'number') {
                    dailyTotals[key] = Math.round(dailyTotals[key] * 10) / 10;
                }
            });
            
            return dailyTotals;
        } catch (error) {
            // Handle error in daily nutrition calculation
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.NUTRITION_CALC_ERROR,
                "Error calculating daily nutrition totals",
                error.message
            );
            return {
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0,
                cost: 0
            };
        }
    }
    
    /**
     * Calculate nutrition percent of daily recommended values
     * @param {Object} nutrition - Nutrition totals
     * @param {Object} person - Person with calorie needs
     * @returns {Object} Percentages of daily values
     */
    function calculateNutritionPercentages(nutrition, calorieNeeds) {
        // Default to 2000 calories if not provided
        const calories = calorieNeeds || 2000;
        
        // Calculate recommended macronutrient amounts
        const recommendedProtein = (calories * DAILY_RECOMMENDED.MACROS.PROTEIN_PERCENT) / CALORIES_PER_GRAM.PROTEIN;
        const recommendedCarbs = (calories * DAILY_RECOMMENDED.MACROS.CARBS_PERCENT) / CALORIES_PER_GRAM.CARBS;
        const recommendedFat = (calories * DAILY_RECOMMENDED.MACROS.FAT_PERCENT) / CALORIES_PER_GRAM.FAT;
        
        // Calculate percentages
        return {
            calories: Math.round((nutrition.calories / calories) * 100),
            protein: Math.round((nutrition.protein / recommendedProtein) * 100),
            carbs: Math.round((nutrition.carbs / recommendedCarbs) * 100),
            fat: Math.round((nutrition.fat / recommendedFat) * 100),
            fiber: Math.round((nutrition.fiber / DAILY_RECOMMENDED.MICROS.FIBER) * 100),
            sodium: Math.round((nutrition.sodium / DAILY_RECOMMENDED.MICROS.SODIUM) * 100),
            calcium: Math.round((nutrition.calcium / DAILY_RECOMMENDED.MICROS.CALCIUM) * 100),
            iron: Math.round((nutrition.iron / DAILY_RECOMMENDED.MICROS.IRON) * 100),
            vitaminA: Math.round((nutrition.vitaminA / DAILY_RECOMMENDED.MICROS.VITAMIN_A) * 100),
            vitaminC: Math.round((nutrition.vitaminC / DAILY_RECOMMENDED.MICROS.VITAMIN_C) * 100)
        };
    }
    
    /**
     * Generate nutrition report for specific time period and family member
     * @param {string} reportType - Type of report (daily, weekly, monthly)
     * @param {string} familyMemberId - ID of family member or 'all'
     * @param {Date} startDate - Start date for report
     * @param {Object} familyMembers - Array of family members
     * @returns {Object} Nutrition report data
     */
    function generateNutritionReport(reportType, familyMemberId, startDate, familyMembers) {
        try {
            const foodDatabase = DataStore.getFoodDatabase();
            const report = {
                labels: [],
                datasets: {
                    calories: {
                        planned: [],
                        consumed: []
                    },
                    protein: {
                        planned: [],
                        consumed: []
                    },
                    carbs: {
                        planned: [],
                        consumed: []
                    },
                    fat: {
                        planned: [],
                        consumed: []
                    },
                    cost: {
                        planned: [],
                        consumed: []
                    }
                }
            };
            
            let dates = [];
            const today = new Date();
            
            // Generate array of dates to include in report
            switch(reportType) {
                case 'daily':
                    dates = [new Date(startDate)];
                    break;
                    
                case 'weekly':
                    // Generate 7 dates for the week
                    const startOfWeek = new Date(startDate);
                    for(let i = 0; i < 7; i++) {
                        const date = new Date(startOfWeek);
                        date.setDate(date.getDate() + i);
                        // Only include dates up to today
                        if (date <= today) {
                            dates.push(date);
                        }
                    }
                    break;
                    
                case 'monthly':
                    // Generate dates for the month
                    const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                    const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
                    const daysInMonth = endOfMonth.getDate();
                    
                    for(let i = 0; i < daysInMonth; i++) {
                        const date = new Date(startOfMonth);
                        date.setDate(date.getDate() + i);
                        // Only include dates up to today
                        if (date <= today) {
                            dates.push(date);
                        }
                    }
                    break;
            }
            
            // Process each date
            dates.forEach(date => {
                const dateString = date.toISOString().split('T')[0];
                report.labels.push(dateString);
                
                // Process for specific member or all members
                if (familyMemberId === 'all') {
                    // Initialize values for this date
                    let totalCaloriesConsumed = 0;
                    let totalProteinConsumed = 0;
                    let totalCarbsConsumed = 0;
                    let totalFatConsumed = 0;
                    let totalCostConsumed = 0;
                    let totalCaloriesPlanned = 0;
                    let totalProteinPlanned = 0;
                    let totalCarbsPlanned = 0;
                    let totalFatPlanned = 0;
                    let totalCostPlanned = 0;
                    
                    // Add nutrition for each family member
                    familyMembers.forEach(member => {
                        // Get consumed meals
                        const consumedMeals = DataStore.getMeals(dateString, member.id);
                        const consumedNutrition = calculateDailyNutrition(consumedMeals, foodDatabase);
                        
                        // Get planned meals
                        const plannedMeals = DataStore.getMealPlans(dateString, member.id);
                        const plannedNutrition = calculateDailyNutrition(plannedMeals, foodDatabase);
                        
                        // Add to totals - consumed
                        totalCaloriesConsumed += consumedNutrition.calories;
                        totalProteinConsumed += consumedNutrition.protein;
                        totalCarbsConsumed += consumedNutrition.carbs;
                        totalFatConsumed += consumedNutrition.fat;
                        totalCostConsumed += consumedNutrition.cost;
                        
                        // Add to totals - planned
                        totalCaloriesPlanned += plannedNutrition.calories;
                        totalProteinPlanned += plannedNutrition.protein;
                        totalCarbsPlanned += plannedNutrition.carbs;
                        totalFatPlanned += plannedNutrition.fat;
                        totalCostPlanned += plannedNutrition.cost;
                    });
                    
                    // Add totals to report - consumed
                    report.datasets.calories.consumed.push(totalCaloriesConsumed);
                    report.datasets.protein.consumed.push(totalProteinConsumed);
                    report.datasets.carbs.consumed.push(totalCarbsConsumed);
                    report.datasets.fat.consumed.push(totalFatConsumed);
                    report.datasets.cost.consumed.push(totalCostConsumed);
                    
                    // Add totals to report - planned
                    report.datasets.calories.planned.push(totalCaloriesPlanned);
                    report.datasets.protein.planned.push(totalProteinPlanned);
                    report.datasets.carbs.planned.push(totalCarbsPlanned);
                    report.datasets.fat.planned.push(totalFatPlanned);
                    report.datasets.cost.planned.push(totalCostPlanned);
                } else {
                    // Get meals for this member and date - consumed
                    const consumedMeals = DataStore.getMeals(dateString, familyMemberId);
                    const consumedNutrition = calculateDailyNutrition(consumedMeals, foodDatabase);
                    
                    // Get meals for this member and date - planned
                    const plannedMeals = DataStore.getMealPlans(dateString, familyMemberId);
                    const plannedNutrition = calculateDailyNutrition(plannedMeals, foodDatabase);
                    
                    // Add to report - consumed
                    report.datasets.calories.consumed.push(consumedNutrition.calories);
                    report.datasets.protein.consumed.push(consumedNutrition.protein);
                    report.datasets.carbs.consumed.push(consumedNutrition.carbs);
                    report.datasets.fat.consumed.push(consumedNutrition.fat);
                    report.datasets.cost.consumed.push(consumedNutrition.cost);
                    
                    // Add to report - planned
                    report.datasets.calories.planned.push(plannedNutrition.calories);
                    report.datasets.protein.planned.push(plannedNutrition.protein);
                    report.datasets.carbs.planned.push(plannedNutrition.carbs);
                    report.datasets.fat.planned.push(plannedNutrition.fat);
                    report.datasets.cost.planned.push(plannedNutrition.cost);
                }
            });
            
            return report;
        } catch (error) {
            // Handle error in report generation
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.NUTRITION_CALC_ERROR,
                "Error generating nutrition report",
                error.message
            );
            return {
                labels: [],
                datasets: {
                    calories: { planned: [], consumed: [] },
                    protein: { planned: [], consumed: [] },
                    carbs: { planned: [], consumed: [] },
                    fat: { planned: [], consumed: [] },
                    cost: { planned: [], consumed: [] }
                }
            };
        }
    }
    
    // Public API
    return {
        calculateBMR,
        calculateTDEE,
        calculateDailyCalorieNeeds,
        calculateMealNutrition,
        calculateDailyNutrition,
        calculateNutritionPercentages,
        generateNutritionReport,
        DAILY_RECOMMENDED,
        ACTIVITY_MULTIPLIERS
    };
})();
