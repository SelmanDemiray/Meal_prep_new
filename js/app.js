/**
 * Main Application Module
 * Coordinates all functionality of the meal and budget tracker application
 */

const App = (function() {
    // Default family members if none exist
    const DEFAULT_FAMILY_MEMBERS = [
        { name: 'Selman', gender: 'male', age: 32, weight: 75, height: 180, weightUnit: 'kg', heightUnit: 'cm', activityLevel: 'MODERATE' },
        { name: 'Aybike', gender: 'female', age: 28, weight: 60, height: 165, weightUnit: 'kg', heightUnit: 'cm', activityLevel: 'LIGHT' },
        { name: 'Alina', gender: 'female', age: 5, weight: 20, height: 110, weightUnit: 'kg', heightUnit: 'cm', activityLevel: 'ACTIVE' }
    ];
    
    /**
     * Initialize the application
     * This is the entry point for the application
     */
    function initialize() {
        try {
            console.log('Initializing Family Meal & Budget Tracker...');
            
            // Initialize the data store with default values if needed
            DataStore.initializeStorage();
            
            // Set up tab navigation
            setupTabNavigation();
            
            // Set up family member management
            setupFamilyMembers();
            
            // Initialize meal tracker with selected family member
            const familyMemberId = getCurrentFamilyMemberId();
            if (familyMemberId) {
                MealTracker.initialize(familyMemberId);
            }
            
            // Initialize budget tracker
            BudgetTracker.initialize();
            
            // Set up reports functionality
            setupReports();
            
            // Set up data reset functionality
            setupDataReset();
            
            console.log('Application initialized successfully');
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UNKNOWN_ERROR,
                "Failed to initialize application",
                error.message
            );
        }
    }
    
    /**
     * Set up tab navigation
     */
    function setupTabNavigation() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs and tab contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Show corresponding tab content
                const targetId = this.id.replace('-tab', '');
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.classList.add('active');
                } else {
                    console.error(`Tab content with ID "${targetId}" not found`);
                }
            });
        });
    }
    
    /**
     * Set up family member management
     */
    function setupFamilyMembers() {
        try {
            // Get family members from storage
            let familyMembers = DataStore.getFamilyMembers(); // Use let as it might be reassigned
            
            // If no family members exist, create default ones
            if (familyMembers.length === 0) {
                DEFAULT_FAMILY_MEMBERS.forEach(memberData => {
                    // Add basic member info first
                    const newMember = DataStore.addFamilyMember(
                        memberData.name,
                        memberData.age,
                        memberData.weight,
                        memberData.height,
                        memberData.activityLevel
                    );
                    
                    if (newMember) {
                        // Now, update this newly created member with additional properties
                        // Fetch the current list (which now includes the newMember with an ID)
                        let currentMembers = DataStore.getFamilyMembers();
                        const memberIndex = currentMembers.findIndex(m => m.id === newMember.id);
                        
                        if (memberIndex !== -1) {
                            // Merge additional properties
                            currentMembers[memberIndex] = {
                                ...currentMembers[memberIndex], // Keep existing properties like ID
                                gender: memberData.gender,
                                weightUnit: memberData.weightUnit,
                                heightUnit: memberData.heightUnit
                            };
                            DataStore.saveFamilyMembers(currentMembers); // Save the updated member list
                        }
                    }
                });
                familyMembers = DataStore.getFamilyMembers(); // Re-fetch after adding defaults
            }
            
            // Populate family member dropdown
            populateFamilyMemberDropdown(familyMembers);
            
            // Set up family member selector change event
            const familyMemberSelect = document.getElementById('family-member');
            if (familyMemberSelect) {
                familyMemberSelect.addEventListener('change', function() {
                    const memberId = this.value;
                    MealTracker.changeFamilyMember(memberId);
                });
            }
            
            // Set up add family member button
            const addFamilyMemberBtn = document.getElementById('add-family-member');
            if (addFamilyMemberBtn) {
                addFamilyMemberBtn.addEventListener('click', showAddFamilyMemberModal);
            }
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_INTERACTION_ERROR,
                "Failed to set up family member management",
                error.message
            );
        }
    }
    
    /**
     * Populate family member dropdown
     * @param {Array} familyMembers - Array of family members
     */
    function populateFamilyMemberDropdown(familyMembers) {
        try {
            const familyMemberSelect = document.getElementById('family-member');
            const reportMemberSelect = document.getElementById('report-member');
            
            if (familyMemberSelect) {
                // Clear existing options
                familyMemberSelect.innerHTML = '';
                
                // Add options for each family member
                familyMembers.forEach(member => {
                    const option = document.createElement('option');
                    option.value = member.id;
                    option.textContent = member.name;
                    familyMemberSelect.appendChild(option);
                });
                
                // Store selected family member ID
                if (familyMemberSelect.options.length > 0) {
                    const selectedMemberId = familyMemberSelect.value;
                    localStorage.setItem('selectedFamilyMemberId', selectedMemberId);
                }
            }
            
            if (reportMemberSelect) {
                // Keep "All Members" option and add new options
                const allOption = reportMemberSelect.querySelector('option[value="all"]');
                reportMemberSelect.innerHTML = '';
                
                if (allOption) {
                    reportMemberSelect.appendChild(allOption);
                }
                
                // Add options for each family member
                familyMembers.forEach(member => {
                    const option = document.createElement('option');
                    option.value = member.id;
                    option.textContent = member.name;
                    reportMemberSelect.appendChild(option);
                });
            }
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_RENDER_ERROR,
                "Failed to populate family member dropdown",
                error.message
            );
        }
    }
    
    /**
     * Get the currently selected family member ID
     * @returns {string} Family member ID
     */
    function getCurrentFamilyMemberId() {
        // Try to get from local storage first
        const storedId = localStorage.getItem('selectedFamilyMemberId');
        if (storedId) {
            return storedId;
        }
        
        // Otherwise get from dropdown
        const familyMemberSelect = document.getElementById('family-member');
        if (familyMemberSelect && familyMemberSelect.options.length > 0) {
            return familyMemberSelect.value;
        }
        
        // If all else fails, try to get first family member
        const familyMembers = DataStore.getFamilyMembers();
        if (familyMembers.length > 0) {
            return familyMembers[0].id;
        }
        
        return null;
    }
    
    /**
     * Show modal for adding a new family member
     */
    function showAddFamilyMemberModal() {
        try {
            const modalOverlay = document.getElementById('modal-overlay');
            const familyModal = document.getElementById('add-family-modal');
            
            if (!modalOverlay || !familyModal) return;
            
            // Create modal content
            familyModal.innerHTML = `
                <h3>Add Family Member</h3>
                <form id="add-family-form" class="modal-form">
                    <div>
                        <label for="name-input">Name:</label>
                        <input type="text" id="name-input" required>
                    </div>
                    <div>
                        <label for="gender-select">Gender:</label>
                        <select id="gender-select" required>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label for="age-input">Age:</label>
                        <input type="number" id="age-input" min="1" max="120" required>
                    </div>
                    <div class="form-row">
                        <div>
                            <label for="weight-input">Weight:</label>
                            <input type="number" id="weight-input" min="1" step="0.1" required>
                        </div>
                        <div>
                            <label for="weight-unit">Unit:</label>
                            <select id="weight-unit">
                                <option value="kg">kg</option>
                                <option value="lb">lb</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div>
                            <label for="height-input">Height:</label>
                            <input type="number" id="height-input" min="1" step="0.1" required>
                        </div>
                        <div>
                            <label for="height-unit">Unit:</label>
                            <select id="height-unit">
                                <option value="cm">cm</option>
                                <option value="in">in</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label for="activity-select">Activity Level:</label>
                        <select id="activity-select" required>
                            <option value="SEDENTARY">Sedentary (little or no exercise)</option>
                            <option value="LIGHT">Light (exercise 1-3 days/week)</option>
                            <option value="MODERATE" selected>Moderate (exercise 3-5 days/week)</option>
                            <option value="ACTIVE">Active (exercise 6-7 days/week)</option>
                            <option value="VERY_ACTIVE">Very Active (hard exercise daily or 2x/day)</option>
                        </select>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" id="cancel-add-family">Cancel</button>
                        <button type="submit">Add Family Member</button>
                    </div>
                </form>
            `;
            
            // Show the modal
            modalOverlay.classList.remove('hidden');
            familyModal.classList.remove('hidden');
            
            // Set up event listeners
            document.getElementById('cancel-add-family').addEventListener('click', closeModal);
            document.getElementById('add-family-form').addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Get form values
                const name = document.getElementById('name-input').value;
                const gender = document.getElementById('gender-select').value;
                const age = document.getElementById('age-input').value;
                const weight = document.getElementById('weight-input').value;
                const weightUnit = document.getElementById('weight-unit').value;
                const height = document.getElementById('height-input').value;
                const heightUnit = document.getElementById('height-unit').value;
                const activityLevel = document.getElementById('activity-select').value;
                
                // Add family member
                addFamilyMember(name, gender, age, weight, height, weightUnit, heightUnit, activityLevel);
                closeModal();
            });
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_RENDER_ERROR,
                "Failed to show add family member modal",
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
     * Add a new family member
     * @param {string} name - Name of the family member
     * @param {string} gender - Gender of the family member
     * @param {number} age - Age in years
     * @param {number} weight - Weight
     * @param {number} height - Height
     * @param {string} weightUnit - Weight unit (kg or lb)
     * @param {string} heightUnit - Height unit (cm or in)
     * @param {string} activityLevel - Activity level
     */
    function addFamilyMember(name, gender, age, weight, height, weightUnit, heightUnit, activityLevel) {
        try {
            // Create family member object with all details
            const newMember = DataStore.addFamilyMember(name, age, weight, height, activityLevel);
            if (newMember) {
                // The newMember object from DataStore.addFamilyMember contains: id, name, age, weight, height, activityLevel.
                // We need to ensure gender, weightUnit, and heightUnit are also saved.
                
                let familyMembers = DataStore.getFamilyMembers();
                const memberIndex = familyMembers.findIndex(m => m.id === newMember.id);
                
                if (memberIndex !== -1) {
                    // Update the member in the array with the additional details
                    familyMembers[memberIndex] = {
                        ...familyMembers[memberIndex], // This includes the ID and other base props
                        gender: gender,
                        weightUnit: weightUnit,
                        heightUnit: heightUnit
                    };
                    DataStore.saveFamilyMembers(familyMembers); // Save the updated list
                }
                
                // Refresh family member dropdown
                populateFamilyMemberDropdown(familyMembers); // Use the updated list
            }
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.DATA_STORAGE_ERROR,
                "Failed to add family member",
                error.message
            );
        }
    }
    
    /**
     * Set up reports functionality
     */
    function setupReports() {
        try {
            // Set up generate report button
            const generateReportBtn = document.getElementById('generate-report');
            if (generateReportBtn) {
                generateReportBtn.addEventListener('click', generateReport);
            }
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_INTERACTION_ERROR,
                "Failed to set up reports functionality",
                error.message
            );
        }
    }
    
    /**
     * Generate nutrition report
     */
    function generateReport() {
        try {
            // Get report parameters
            const reportType = document.getElementById('report-type').value;
            const familyMemberId = document.getElementById('report-member').value;
            
            // Use current date as start date
            const startDate = new Date();
            if (reportType === 'weekly') {
                // Set to beginning of week (Sunday)
                startDate.setDate(startDate.getDate() - startDate.getDay());
            } else if (reportType === 'monthly') {
                // Set to first day of month
                startDate.setDate(1);
            }
            
            // Get family members for the report
            const familyMembers = DataStore.getFamilyMembers();
            
            // Generate report data
            const reportData = NutritionCalculator.generateNutritionReport(
                reportType,
                familyMemberId,
                startDate,
                familyMembers
            );
            
            // Render the report
            renderReport(reportData, reportType, familyMemberId);
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_RENDER_ERROR,
                "Failed to generate report",
                error.message
            );
        }
    }
    
    /**
     * Render nutrition report
     * @param {Object} reportData - Data for the report
     * @param {string} reportType - Type of report (daily, weekly, monthly)
     * @param {string} familyMemberId - ID of the family member or 'all'
     */
    function renderReport(reportData, reportType, familyMemberId) {
        try {
            const chartsContainer = document.getElementById('nutrition-charts');
            if (!chartsContainer) return;
            
            // Clear existing charts
            chartsContainer.innerHTML = '';
            
            // Create family member name for title
            let memberName = "All Family Members";
            if (familyMemberId !== 'all') {
                const familyMembers = DataStore.getFamilyMembers();
                const member = familyMembers.find(m => m.id === familyMemberId);
                if (member) {
                    memberName = member.name;
                }
            }
            
            // Report title
            const reportTitle = document.createElement('h3');
            reportTitle.textContent = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Nutrition Report: ${memberName}`;
            chartsContainer.appendChild(reportTitle);
            
            // Create canvas elements for charts
            const caloriesChartEl = document.createElement('div');
            caloriesChartEl.className = 'chart-container';
            caloriesChartEl.innerHTML = `
                <h4>Calories</h4>
                <canvas id="calories-chart"></canvas>
            `;
            
            const nutrientsChartEl = document.createElement('div');
            nutrientsChartEl.className = 'chart-container';
            nutrientsChartEl.innerHTML = `
                <h4>Macronutrients</h4>
                <canvas id="nutrients-chart"></canvas>
            `;
            
            const costChartEl = document.createElement('div');
            costChartEl.className = 'chart-container';
            costChartEl.innerHTML = `
                <h4>Food Costs</h4>
                <canvas id="cost-chart"></canvas>
            `;
            
            // Add chart containers to the page
            chartsContainer.appendChild(caloriesChartEl);
            chartsContainer.appendChild(nutrientsChartEl);
            chartsContainer.appendChild(costChartEl);
            
            // Render the charts showing both planned and consumed data
            renderComparisonChart('calories-chart', 'Calories', reportData.labels, reportData.datasets.calories);
            
            // For macronutrients, render planned vs consumed for each nutrient
            renderMacronutrientCharts('nutrients-chart', reportData);
            
            // For costs
            renderComparisonChart('cost-chart', 'Food Cost ($)', reportData.labels, reportData.datasets.cost);
            
            // Add summary statistics
            const summaryEl = document.createElement('div');
            summaryEl.className = 'report-summary';
            
            // Calculate averages for consumed meals
            const avgCaloriesConsumed = calculateAverage(reportData.datasets.calories.consumed);
            const avgProteinConsumed = calculateAverage(reportData.datasets.protein.consumed);
            const avgCarbsConsumed = calculateAverage(reportData.datasets.carbs.consumed);
            const avgFatConsumed = calculateAverage(reportData.datasets.fat.consumed);
            const avgCostConsumed = calculateAverage(reportData.datasets.cost.consumed);
            
            // Calculate averages for planned meals
            const avgCaloriesPlanned = calculateAverage(reportData.datasets.calories.planned);
            const avgProteinPlanned = calculateAverage(reportData.datasets.protein.planned);
            const avgCarbsPlanned = calculateAverage(reportData.datasets.carbs.planned);
            const avgFatPlanned = calculateAverage(reportData.datasets.fat.planned);
            const avgCostPlanned = calculateAverage(reportData.datasets.cost.planned);
            
            // Create summary HTML with comparisons
            summaryEl.innerHTML = `
                <h4>Summary Statistics</h4>
                <div class="summary-tabs">
                    <button class="summary-tab active" data-tab="consumed">Consumed</button>
                    <button class="summary-tab" data-tab="planned">Planned</button>
                    <button class="summary-tab" data-tab="comparison">Comparison</button>
                </div>
                
                <div class="summary-content active" id="consumed-summary">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">Avg Daily Calories:</span>
                            <span class="summary-value">${avgCaloriesConsumed.toFixed(0)} kcal</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Avg Daily Protein:</span>
                            <span class="summary-value">${avgProteinConsumed.toFixed(1)}g</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Avg Daily Carbs:</span>
                            <span class="summary-value">${avgCarbsConsumed.toFixed(1)}g</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Avg Daily Fat:</span>
                            <span class="summary-value">${avgFatConsumed.toFixed(1)}g</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Avg Daily Food Cost:</span>
                            <span class="summary-value">$${avgCostConsumed.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="summary-content" id="planned-summary">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">Avg Daily Calories:</span>
                            <span class="summary-value">${avgCaloriesPlanned.toFixed(0)} kcal</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Avg Daily Protein:</span>
                            <span class="summary-value">${avgProteinPlanned.toFixed(1)}g</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Avg Daily Carbs:</span>
                            <span class="summary-value">${avgCarbsPlanned.toFixed(1)}g</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Avg Daily Fat:</span>
                            <span class="summary-value">${avgFatPlanned.toFixed(1)}g</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Avg Daily Food Cost:</span>
                            <span class="summary-value">$${avgCostPlanned.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="summary-content" id="comparison-summary">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">Calories Difference:</span>
                            <span class="summary-value comparison ${avgCaloriesConsumed > avgCaloriesPlanned ? 'positive' : 'negative'}">
                                ${(avgCaloriesConsumed - avgCaloriesPlanned).toFixed(0)} kcal
                            </span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Protein Difference:</span>
                            <span class="summary-value comparison ${avgProteinConsumed > avgProteinPlanned ? 'positive' : 'negative'}">
                                ${(avgProteinConsumed - avgProteinPlanned).toFixed(1)}g
                            </span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Cost Difference:</span>
                            <span class="summary-value comparison ${avgCostConsumed > avgCostPlanned ? 'negative' : 'positive'}">
                                $${Math.abs(avgCostConsumed - avgCostPlanned).toFixed(2)} ${avgCostConsumed > avgCostPlanned ? 'over' : 'under'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
            
            chartsContainer.appendChild(summaryEl);
            
            // Set up summary tab functionality
            const summaryTabs = summaryEl.querySelectorAll('.summary-tab');
            const summaryContents = summaryEl.querySelectorAll('.summary-content');
            
            summaryTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    // Remove active class from all tabs and contents
                    summaryTabs.forEach(t => t.classList.remove('active'));
                    summaryContents.forEach(c => c.classList.remove('active'));
                    
                    // Add active class to clicked tab
                    this.classList.add('active');
                    
                    // Show corresponding content
                    const tabId = this.getAttribute('data-tab');
                    document.getElementById(`${tabId}-summary`).classList.add('active');
                });
            });
            
        } catch (error) {
            ErrorHandler.handleError(
                ErrorHandler.ERROR_CODES.UI_RENDER_ERROR,
                "Failed to render report",
                error.message
            );
        }
    }
    
    /**
     * Render a chart comparing planned vs consumed values
     * @param {string} containerId - ID of container element
     * @param {string} label - Chart label
     * @param {Array} labels - X-axis labels
     * @param {Object} data - Object containing planned and consumed data arrays
     */
    function renderComparisonChart(containerId, label, labels, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Find the maximum value for scaling
        const maxValue = Math.max(
            ...data.planned,
            ...data.consumed,
            1 // Ensure at least 1 to avoid division by zero
        );
        
        // Create bars for each data point
        const chartHtml = labels.map((label, index) => {
            const plannedValue = data.planned[index] || 0;
            const consumedValue = data.consumed[index] || 0;
            
            const plannedPercentage = (plannedValue / maxValue) * 100;
            const consumedPercentage = (consumedValue / maxValue) * 100;
            
            return `
                <div class="chart-item">
                    <div class="chart-bar-container comparison">
                        <div class="chart-bar planned" style="height: ${plannedPercentage}%" 
                             title="Planned: ${plannedValue.toFixed(1)}"></div>
                        <div class="chart-bar consumed" style="height: ${consumedPercentage}%"
                             title="Consumed: ${consumedValue.toFixed(1)}"></div>
                    </div>
                    <div class="chart-label">${label}</div>
                </div>
            `;
        }).join('');
        
        // Create chart legend
        const legendHtml = `
            <div class="chart-legend">
                <span class="chart-series planned-series">${label} (Planned)</span>
                <span class="chart-series consumed-series">${label} (Consumed)</span>
            </div>
        `;
        
        // Combine everything
        container.innerHTML = `
            <div class="comparison-chart">
                <div class="chart-bars">
                    ${chartHtml}
                </div>
                ${legendHtml}
            </div>
        `;
    }
    
    /**
     * Render macronutrient charts
     * @param {string} containerId - ID of container element
     * @param {Object} reportData - Report data with all nutrients
     */
    function renderMacronutrientCharts(containerId, reportData) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Create tab navigation for macronutrient charts
        container.innerHTML = `
            <div class="nutrient-tabs">
                <button class="nutrient-tab active" data-nutrient="protein">Protein</button>
                <button class="nutrient-tab" data-nutrient="carbs">Carbs</button>
                <button class="nutrient-tab" data-nutrient="fat">Fat</button>
            </div>
            <div id="nutrient-chart-container"></div>
        `;
        
        // Add click event for tabs
        const tabs = container.querySelectorAll('.nutrient-tab');
        const chartContainer = container.querySelector('#nutrient-chart-container');
        
        // Initially show protein chart
        renderComparisonChart('nutrient-chart-container', 'Protein (g)', reportData.labels, reportData.datasets.protein);
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                const nutrient = this.getAttribute('data-nutrient');
                renderComparisonChart('nutrient-chart-container', `${nutrient.charAt(0).toUpperCase() + nutrient.slice(1)} (g)`, 
                                      reportData.labels, reportData.datasets[nutrient]);
            });
        });
    }
    
    /**
     * Calculate average of an array of numbers
     * @param {Array} values - Array of numbers
     * @returns {number} Average
     */
    function calculateAverage(values) {
        if (!values || values.length === 0) return 0;
        const sum = values.reduce((a, b) => a + b, 0);
        return sum / values.length;
    }
    
    /**
     * Set up data reset functionality
     */
    function setupDataReset() {
        const resetDataLink = document.getElementById('reset-data');
        if (resetDataLink) {
            resetDataLink.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Ask for confirmation
                if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
                    // Reset all data
                    DataStore.resetAllData();
                    
                    // Reload the page
                    window.location.reload();
                }
            });
        }
    }
    
    // Public API
    return {
        initialize
    };
})();

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    App.initialize();
});
