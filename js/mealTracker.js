/**
 * Meal Tracker Module
 * Manages all meal tracking functionality including adding, editing, and deleting meals
 */

const MealTracker = (function() {
    // Current state
    let currentDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
    let currentFamilyMemberId = null; // Currently selected family member
    let meals = {}; // Current consumed meals for the selected date and family member
    let mealPlans = {}; // Current planned meals for the selected date and family member
    let viewMode = 'consumed'; // 'consumed' or 'planned'
    
    /**
     * Initialize the meal tracker
     * @param {string} familyMemberId - ID of initially selected family member
     */
    function initialize(familyMemberId) {
        try {
            // Set current family member
            currentFamilyMemberId = familyMemberId;
            
            // Load meals for today's date and selected family member
            loadMeals();
            
            // Set up date picker with current date
            const datePicker = document.getElementById('selected-date');
            if (datePicker) {
                datePicker.value = currentDate;
                
                // Add event listener for date change
                datePicker.addEventListener('change', function() {
                    currentDate = this.value;
                    loadMeals();
                });
            }
            
            // Set up previous and next day buttons
            setupDateNavigation();
            
            // Set up add meal buttons
            setupAddMealButtons();
            
            // Set up view mode toggle
            setupViewModeToggle();
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_INTERACTION_ERROR,
                "Failed to initialize meal tracker",
                error.message
            );
        }
    }
    
    /**
     * Set up event listeners for previous and next day buttons
     */
    function setupDateNavigation() {
        // Previous day button
        const prevDayBtn = document.getElementById('prev-day');
        if (prevDayBtn) {
            prevDayBtn.addEventListener('click', function() {
                const datePicker = document.getElementById('selected-date');
                const currentDateObj = new Date(currentDate);
                currentDateObj.setDate(currentDateObj.getDate() - 1);
                currentDate = currentDateObj.toISOString().split('T')[0];
                datePicker.value = currentDate;
                loadMeals();
            });
        }
        
        // Next day button
        const nextDayBtn = document.getElementById('next-day');
        if (nextDayBtn) {
            nextDayBtn.addEventListener('click', function() {
                const datePicker = document.getElementById('selected-date');
                const currentDateObj = new Date(currentDate);
                currentDateObj.setDate(currentDateObj.getDate() + 1);
                currentDate = currentDateObj.toISOString().split('T')[0];
                datePicker.value = currentDate;
                loadMeals();
            });
        }
    }
    
    /**
     * Set up event listeners for add meal buttons
     */
    function setupAddMealButtons() {
        const addMealButtons = document.querySelectorAll('.add-meal');
        
        addMealButtons.forEach(button => {
            button.addEventListener('click', function() {
                const mealType = this.getAttribute('data-meal-type');
                showAddMealModal(mealType);
            });
        });
    }
    
    /**
     * Set up view mode toggle (consumed vs planned)
     */
    function setupViewModeToggle() {
        // Create toggle buttons if they don't exist
        const controlsDiv = document.querySelector('.controls');
        if (controlsDiv) {
            // Check if toggle already exists
            if (!document.getElementById('view-mode-toggle')) {
                const toggleDiv = document.createElement('div');
                toggleDiv.className = 'view-mode-toggle';
                toggleDiv.innerHTML = `
                    <button id="consumed-mode" class="mode-btn active">Consumed Meals</button>
                    <button id="planned-mode" class="mode-btn">Meal Planning</button>
                `;
                controlsDiv.appendChild(toggleDiv);
                
                // Add event listeners
                document.getElementById('consumed-mode').addEventListener('click', function() {
                    changeViewMode('consumed');
                });
                
                document.getElementById('planned-mode').addEventListener('click', function() {
                    changeViewMode('planned');
                });
            }
        }
    }
    
    /**
     * Change view mode between consumed and planned meals
     * @param {string} mode - 'consumed' or 'planned'
     */
    function changeViewMode(mode) {
        viewMode = mode;
        
        // Update button styling
        const consumedBtn = document.getElementById('consumed-mode');
        const plannedBtn = document.getElementById('planned-mode');
        
        if (consumedBtn && plannedBtn) {
            if (mode === 'consumed') {
                consumedBtn.classList.add('active');
                plannedBtn.classList.remove('active');
            } else {
                consumedBtn.classList.remove('active');
                plannedBtn.classList.add('active');
            }
        }
        
        // Re-render meals based on new mode
        renderMeals();
        updateNutritionSummary();
    }
    
    /**
     * Change the currently selected family member
     * @param {string} familyMemberId - ID of the family member to select
     */
    function changeFamilyMember(familyMemberId) {
        currentFamilyMemberId = familyMemberId;
        loadMeals();
    }
    
    /**
     * Load meals for the current date and family member
     */
    function loadMeals() {
        try {
            // Check if family member is selected
            if (!currentFamilyMemberId) {
                return;
            }
            
            // Get meals data from storage
            meals = DataStore.getMeals(currentDate, currentFamilyMemberId);
            mealPlans = DataStore.getMealPlans(currentDate, currentFamilyMemberId);
            
            // Render meals in UI
            renderMeals();
            
            // Update nutrition summary
            updateNutritionSummary();
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.DATA_NOT_FOUND,
                "Failed to load meals",
                error.message
            );
        }
    }
    
    /**
     * Render meals in the UI
     */
    function renderMeals() {
        try {
            const foodDatabase = DataStore.getFoodDatabase();
            const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
            const dataToRender = viewMode === 'consumed' ? meals : mealPlans;
            
            mealTypes.forEach(mealType => {
                const containerEl = document.getElementById(`${mealType === 'snacks' ? 'snack' : mealType}-items`);
                if (!containerEl) return;
                
                // Clear existing content
                containerEl.innerHTML = '';
                
                // Check if we have meals of this type
                if (dataToRender[mealType] && dataToRender[mealType].length > 0) {
                    // Render each meal item
                    dataToRender[mealType].forEach((item, index) => {
                        // Find food details in database
                        const food = foodDatabase.find(f => f.id.toString() === item.foodId.toString());
                        
                        if (food) {
                            // Calculate nutrition for this item
                            const servings = parseFloat(item.servings) || 1;
                            const calories = Math.round(food.calories * servings);
                            const protein = Math.round(food.protein * servings * 10) / 10;
                            const carbs = Math.round(food.carbs * servings * 10) / 10;
                            const fat = Math.round(food.fat * servings * 10) / 10;
                            
                            // Calculate cost if available
                            let costDisplay = '';
                            if (food.costPerServing) {
                                const cost = Math.round(food.costPerServing * servings * 100) / 100;
                                costDisplay = `<span class="cost">$${cost.toFixed(2)}</span>`;
                            }
                            
                            // Create meal item element with different actions based on view mode
                            const mealItemEl = document.createElement('div');
                            mealItemEl.className = 'meal-item';
                            
                            // Different actions for consumed vs planned meals
                            let actionsHtml = '';
                            if (viewMode === 'consumed') {
                                actionsHtml = `
                                    <button class="edit-meal" data-meal-type="${mealType}" data-meal-index="${index}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="delete-meal" data-meal-type="${mealType}" data-meal-index="${index}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                `;
                            } else {
                                actionsHtml = `
                                    <button class="consume-meal" data-meal-type="${mealType}" data-meal-index="${index}">
                                        <i class="fas fa-check"></i>
                                    </button>
                                    <button class="edit-meal" data-meal-type="${mealType}" data-meal-index="${index}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="delete-meal" data-meal-type="${mealType}" data-meal-index="${index}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                `;
                            }
                            
                            mealItemEl.innerHTML = `
                                <div class="actions">
                                    ${actionsHtml}
                                </div>
                                <h4>${food.name} ${costDisplay}</h4>
                                <p class="serving">Serving: ${servings} × ${food.servingSize}</p>
                                <p class="nutrition">
                                    <span class="calories">${calories} cal</span> | 
                                    <span class="protein">${protein}g protein</span> | 
                                    <span class="carbs">${carbs}g carbs</span> | 
                                    <span class="fat">${fat}g fat</span>
                                </p>
                                <p class="notes">${item.notes || ''}</p>
                            `;
                            
                            // Add event listeners to buttons
                            containerEl.appendChild(mealItemEl);
                            
                            // Setup edit button
                            const editBtn = mealItemEl.querySelector('.edit-meal');
                            if (editBtn) {
                                editBtn.addEventListener('click', function() {
                                    const mealType = this.getAttribute('data-meal-type');
                                    const mealIndex = parseInt(this.getAttribute('data-meal-index'));
                                    showEditMealModal(mealType, mealIndex);
                                });
                            }
                            
                            // Setup delete button
                            const deleteBtn = mealItemEl.querySelector('.delete-meal');
                            if (deleteBtn) {
                                deleteBtn.addEventListener('click', function() {
                                    const mealType = this.getAttribute('data-meal-type');
                                    const mealIndex = parseInt(this.getAttribute('data-meal-index'));
                                    deleteMeal(mealType, mealIndex);
                                });
                            }
                            
                            // Setup consume button for planned meals
                            const consumeBtn = mealItemEl.querySelector('.consume-meal');
                            if (consumeBtn) {
                                consumeBtn.addEventListener('click', function() {
                                    const mealType = this.getAttribute('data-meal-type');
                                    const mealIndex = parseInt(this.getAttribute('data-meal-index'));
                                    consumePlannedMeal(mealType, mealIndex);
                                });
                            }
                        }
                    });
                } else {
                    // Show empty state
                    containerEl.innerHTML = `<p class="empty-state">No ${viewMode === 'consumed' ? 'consumed' : 'planned'} ${mealType} items for today.</p>`;
                }
            });
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_RENDER_ERROR,
                "Failed to render meals",
                error.message
            );
        }
    }
    
    /**
     * Update the nutrition summary display
     */
    function updateNutritionSummary() {
        try {
            const summaryEl = document.getElementById('nutrition-summary');
            if (!summaryEl) return;
            
            // Get food database for nutrition calculation
            const foodDatabase = DataStore.getFoodDatabase();
            
            // Calculate daily nutrition based on view mode
            const dataToUse = viewMode === 'consumed' ? meals : mealPlans;
            const dailyNutrition = NutritionCalculator.calculateDailyNutrition(dataToUse, foodDatabase);
            
            // Get family member details for personalized recommendations
            const familyMembers = DataStore.getFamilyMembers();
            const currentMember = familyMembers.find(m => m.id === currentFamilyMemberId);
            
            let calorieNeeds = 2000; // Default
            
            if (currentMember) {
                // Format person object for nutrition calculator
                const person = {
                    gender: currentMember.gender || 'female',
                    age: parseInt(currentMember.age) || 30,
                    weight: parseFloat(currentMember.weight) || 70,
                    height: parseFloat(currentMember.height) || 170,
                    weightUnit: currentMember.weightUnit || 'kg',
                    heightUnit: currentMember.heightUnit || 'cm',
                    activityLevel: currentMember.activityLevel || 'MODERATE'
                };
                
                // Calculate personalized calorie needs
                calorieNeeds = NutritionCalculator.calculateDailyCalorieNeeds(person);
            }
            
            // Calculate percentages of recommended values
            const percentages = NutritionCalculator.calculateNutritionPercentages(dailyNutrition, calorieNeeds);
            
            // Add view mode indicator to the summary
            const viewModeLabel = viewMode === 'consumed' ? 'Consumed Today' : 'Planned for Today';
            
            // Create the HTML for the nutrition summary
            let summaryHTML = `
                <h4 class="summary-mode">${viewModeLabel}</h4>
                <div class="nutrition-summary-grid">
                    <div class="nutrition-card">
                        <h4>Calories</h4>
                        <div class="nutrition-value">${dailyNutrition.calories}</div>
                        <div class="nutrition-target">of ${calorieNeeds} kcal (${percentages.calories}%)</div>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.min(percentages.calories, 100)}%"></div>
                        </div>
                    </div>
                    
                    <div class="nutrition-card">
                        <h4>Protein</h4>
                        <div class="nutrition-value">${dailyNutrition.protein}g</div>
                        <div class="nutrition-target">${percentages.protein}% of daily target</div>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.min(percentages.protein, 100)}%"></div>
                        </div>
                    </div>
                    
                    <div class="nutrition-card">
                        <h4>Carbohydrates</h4>
                        <div class="nutrition-value">${dailyNutrition.carbs}g</div>
                        <div class="nutrition-target">${percentages.carbs}% of daily target</div>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.min(percentages.carbs, 100)}%"></div>
                        </div>
                    </div>
                    
                    <div class="nutrition-card">
                        <h4>Fat</h4>
                        <div class="nutrition-value">${dailyNutrition.fat}g</div>
                        <div class="nutrition-target">${percentages.fat}% of daily target</div>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.min(percentages.fat, 100)}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="daily-cost">
                    <h4>Estimated Daily Food Cost: $${dailyNutrition.cost.toFixed(2)}</h4>
                </div>
            `;
            
            summaryEl.innerHTML = summaryHTML;
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_RENDER_ERROR,
                "Failed to update nutrition summary",
                error.message
            );
        }
    }
    
    /**
     * Show modal for adding a new meal
     * @param {string} mealType - Type of meal (breakfast, lunch, dinner, snacks)
     */
    function showAddMealModal(mealType) {
        try {
            const modalOverlay = document.getElementById('modal-overlay');
            const mealModal = document.getElementById('add-meal-modal');
            
            if (!modalOverlay || !mealModal) return;
            
            // Get food database for select options
            const foodDatabase = DataStore.getFoodDatabase();
            
            // Create food options HTML
            let foodOptionsHTML = '';
            foodDatabase.forEach(food => {
                const costInfo = food.costPerServing ? ` - $${food.costPerServing.toFixed(2)}` : '';
                foodOptionsHTML += `<option value="${food.id}">${food.name} (${food.servingSize}${costInfo})</option>`;
            });
            
            // Create modal content with meal type and mode selection
            mealModal.innerHTML = `
                <h3>Add ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Item</h3>
                <form id="add-meal-form" class="modal-form">
                    <div>
                        <label for="food-select">Food:</label>
                        <select id="food-select" required>
                            <option value="">Select a food</option>
                            ${foodOptionsHTML}
                        </select>
                    </div>
                    <div>
                        <label for="servings-input">Servings:</label>
                        <input type="number" id="servings-input" min="0.25" step="0.25" value="1" required>
                    </div>
                    <div>
                        <label for="notes-input">Notes:</label>
                        <textarea id="notes-input" rows="2"></textarea>
                    </div>
                    <div>
                        <label for="meal-status">Add as:</label>
                        <select id="meal-status">
                            <option value="${viewMode}">${viewMode === 'consumed' ? 'Consumed Meal' : 'Planned Meal'}</option>
                            <option value="${viewMode === 'consumed' ? 'planned' : 'consumed'}">${viewMode === 'consumed' ? 'Planned Meal' : 'Consumed Meal'}</option>
                        </select>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" id="cancel-add-meal">Cancel</button>
                        <button type="submit">Add Meal</button>
                    </div>
                </form>
            `;
            
            // Show the modal
            modalOverlay.classList.remove('hidden');
            mealModal.classList.remove('hidden');
            
            // Set up event listeners
            document.getElementById('cancel-add-meal').addEventListener('click', closeModal);
            document.getElementById('add-meal-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const foodId = document.getElementById('food-select').value;
                const servings = document.getElementById('servings-input').value;
                const notes = document.getElementById('notes-input').value;
                const status = document.getElementById('meal-status').value;
                
                addMeal(mealType, foodId, servings, notes, status);
                closeModal();
            });
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_RENDER_ERROR,
                "Failed to show add meal modal",
                error.message
            );
        }
    }
    
    /**
     * Show modal for editing a meal
     * @param {string} mealType - Type of meal
     * @param {number} mealIndex - Index of meal in the array
     */
    function showEditMealModal(mealType, mealIndex) {
        try {
            const modalOverlay = document.getElementById('modal-overlay');
            const mealModal = document.getElementById('add-meal-modal');
            
            if (!modalOverlay || !mealModal) return;
            
            // Get meal item to edit based on current view mode
            const dataToEdit = viewMode === 'consumed' ? meals : mealPlans;
            const mealItem = dataToEdit[mealType][mealIndex];
            
            if (!mealItem) return;
            
            // Get food database for select options
            const foodDatabase = DataStore.getFoodDatabase();
            
            // Create food options HTML
            let foodOptionsHTML = '';
            foodDatabase.forEach(food => {
                const selected = food.id.toString() === mealItem.foodId.toString() ? 'selected' : '';
                const costInfo = food.costPerServing ? ` - $${food.costPerServing.toFixed(2)}` : '';
                foodOptionsHTML += `<option value="${food.id}" ${selected}>${food.name} (${food.servingSize}${costInfo})</option>`;
            });
            
            // Create modal content
            mealModal.innerHTML = `
                <h3>Edit ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Item</h3>
                <form id="edit-meal-form" class="modal-form">
                    <div>
                        <label for="food-select">Food:</label>
                        <select id="food-select" required>
                            <option value="">Select a food</option>
                            ${foodOptionsHTML}
                        </select>
                    </div>
                    <div>
                        <label for="servings-input">Servings:</label>
                        <input type="number" id="servings-input" min="0.25" step="0.25" value="${mealItem.servings}" required>
                    </div>
                    <div>
                        <label for="notes-input">Notes:</label>
                        <textarea id="notes-input" rows="2">${mealItem.notes || ''}</textarea>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" id="cancel-edit-meal">Cancel</button>
                        <button type="submit">Save Changes</button>
                    </div>
                </form>
            `;
            
            // Show the modal
            modalOverlay.classList.remove('hidden');
            mealModal.classList.remove('hidden');
            
            // Set up event listeners
            document.getElementById('cancel-edit-meal').addEventListener('click', closeModal);
            document.getElementById('edit-meal-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const foodId = document.getElementById('food-select').value;
                const servings = document.getElementById('servings-input').value;
                const notes = document.getElementById('notes-input').value;
                
                updateMeal(mealType, mealIndex, foodId, servings, notes);
                closeModal();
            });
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_RENDER_ERROR,
                "Failed to show edit meal modal",
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
     * Add a new meal
     * @param {string} mealType - Type of meal
     * @param {string} foodId - ID of the selected food
     * @param {number} servings - Number of servings
     * @param {string} notes - Any notes about the meal
     * @param {string} status - 'consumed' or 'planned'
     */
    function addMeal(mealType, foodId, servings, notes, status) {
        try {
            // Determine which data structure to update
            const targetData = status === 'consumed' ? meals : mealPlans;
            
            // Ensure meals object has the meal type
            if (!targetData[mealType]) {
                targetData[mealType] = [];
            }
            
            // Add new meal item
            targetData[mealType].push({
                foodId,
                servings: parseFloat(servings) || 1,
                notes: notes || '',
                timestamp: Date.now(), // Metadata: when the meal was added
                status: status // Track if this is consumed or planned
            });
            
            // Save changes
            if (status === 'consumed') {
                DataStore.saveMeals(currentDate, currentFamilyMemberId, targetData);
            } else {
                DataStore.saveMealPlans(currentDate, currentFamilyMemberId, targetData);
            }
            
            // If we're adding to a different mode than currently viewing, no need to re-render
            if (status === viewMode) {
                // Re-render meals and update nutrition
                renderMeals();
                updateNutritionSummary();
            }
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.MEAL_ADD_ERROR,
                "Failed to add meal",
                error.message
            );
        }
    }
    
    /**
     * Update an existing meal
     * @param {string} mealType - Type of meal
     * @param {number} index - Index of the meal in the array
     * @param {string} foodId - ID of the selected food
     * @param {number} servings - Number of servings
     * @param {string} notes - Any notes about the meal
     */
    function updateMeal(mealType, index, foodId, servings, notes) {
        try {
            // Determine which data structure to update
            const targetData = viewMode === 'consumed' ? meals : mealPlans;
            
            // Check if meal exists
            if (!targetData[mealType] || !targetData[mealType][index]) {
                throw new Error("Meal not found");
            }
            
            // Update meal item (preserve original timestamp but add updated timestamp)
            const originalTimestamp = targetData[mealType][index].timestamp || Date.now();
            const originalStatus = targetData[mealType][index].status || viewMode;
            
            targetData[mealType][index] = {
                foodId,
                servings: parseFloat(servings) || 1,
                notes: notes || '',
                timestamp: originalTimestamp,
                status: originalStatus,
                updatedAt: Date.now() // Metadata: when the meal was updated
            };
            
            // Save changes
            if (viewMode === 'consumed') {
                DataStore.saveMeals(currentDate, currentFamilyMemberId, targetData);
            } else {
                DataStore.saveMealPlans(currentDate, currentFamilyMemberId, targetData);
            }
            
            // Re-render meals and update nutrition
            renderMeals();
            updateNutritionSummary();
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.MEAL_UPDATE_ERROR,
                "Failed to update meal",
                error.message
            );
        }
    }
    
    /**
     * Delete a meal
     * @param {string} mealType - Type of meal
     * @param {number} index - Index of the meal in the array
     */
    function deleteMeal(mealType, index) {
        try {
            // Determine which data structure to update
            const targetData = viewMode === 'consumed' ? meals : mealPlans;
            
            // Check if meal exists
            if (!targetData[mealType] || !targetData[mealType][index]) {
                throw new Error("Meal not found");
            }
            
            // Remove meal item
            targetData[mealType].splice(index, 1);
            
            // Save changes
            if (viewMode === 'consumed') {
                DataStore.saveMeals(currentDate, currentFamilyMemberId, targetData);
            } else {
                DataStore.saveMealPlans(currentDate, currentFamilyMemberId, targetData);
            }
            
            // Re-render meals and update nutrition
            renderMeals();
            updateNutritionSummary();
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.MEAL_DELETE_ERROR,
                "Failed to delete meal",
                error.message
            );
        }
    }
    
    /**
     * Convert a planned meal to consumed
     * @param {string} mealType - Type of meal
     * @param {number} index - Index of the meal in the planned meals array
     */
    function consumePlannedMeal(mealType, index) {
        try {
            // Use the data store function to convert
            const success = DataStore.convertPlanToMeal(
                currentDate, 
                currentFamilyMemberId, 
                mealType, 
                index
            );
            
            if (success) {
                // Reload meals data
                meals = DataStore.getMeals(currentDate, currentFamilyMemberId);
                mealPlans = DataStore.getMealPlans(currentDate, currentFamilyMemberId);
                
                // Re-render meals and update nutrition
                renderMeals();
                updateNutritionSummary();
                
                // Show success message
                alert('Meal marked as consumed!');
            }
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.MEAL_UPDATE_ERROR,
                "Failed to mark meal as consumed",
                error.message
            );
        }
    }
    
    // Public API
    return {
        initialize,
        changeFamilyMember,
        loadMeals,
        renderMeals,
        updateNutritionSummary,
        changeViewMode
    };
})();
