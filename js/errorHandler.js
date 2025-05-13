/**
 * Error Handler Module
 * Handles all errors in the application with a centralized system
 */

// Creating an immediate function to encapsulate our error handler in its own scope
const ErrorHandler = (function() {
    // Private error code mapping for different types of errors
    const ERROR_CODES = {
        // Data errors (1000-1999)
        DATA_STORAGE_ERROR: 1001, // Error with localStorage operations
        DATA_PARSE_ERROR: 1002, // Error parsing JSON data
        DATA_NOT_FOUND: 1003, // Requested data not found
        
        // UI errors (2000-2999)
        UI_RENDER_ERROR: 2001, // Error rendering UI components
        UI_INTERACTION_ERROR: 2002, // Error with user interactions
        
        // Meal tracking errors (3000-3999)
        MEAL_ADD_ERROR: 3001, // Error adding a meal
        MEAL_DELETE_ERROR: 3002, // Error deleting a meal
        MEAL_UPDATE_ERROR: 3003, // Error updating a meal
        
        // Budget tracking errors (4000-4999)
        BUDGET_ADD_ERROR: 4001, // Error adding a budget item
        BUDGET_DELETE_ERROR: 4002, // Error deleting a budget item
        BUDGET_UPDATE_ERROR: 4003, // Error updating a budget
        
        // Nutrition calculation errors (5000-5999)
        NUTRITION_CALC_ERROR: 5001, // Error calculating nutrition values
        
        // System errors (9000-9999)
        UNKNOWN_ERROR: 9999 // Unknown or unspecified error
    };
    
    // Error logging function - logs to console and optionally to a server
    function logError(code, message, details) {
        // Create error object with timestamp
        const error = {
            code: code,
            message: message,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        // Log to console
        console.error('Error:', error);
        
        // In a real app, you might send this to a server
        // sendErrorToServer(error);
        
        return error;
    }
    
    // Display error message to the user
    function displayError(errorObj) {
        const errorBanner = document.getElementById('error-banner');
        if (errorBanner) {
            // Create error message with code and text
            errorBanner.innerHTML = `
                <div>
                    <strong>Error ${errorObj.code}:</strong> ${errorObj.message}
                </div>
                <button id="close-error">&times;</button>
            `;
            
            // Show the error banner
            errorBanner.classList.remove('hidden');
            
            // Add click handler to close button
            const closeButton = document.getElementById('close-error');
            if (closeButton) {
                closeButton.addEventListener('click', function() {
                    errorBanner.classList.add('hidden');
                });
            }
            
            // Auto-hide non-critical errors after 5 seconds
            if (errorObj.code < 9000) {
                setTimeout(function() {
                    errorBanner.classList.add('hidden');
                }, 5000);
            }
        }
    }
    
    // Handle an error - logs it and displays to user
    function handleError(code, message, details = null) {
        const errorObj = logError(code, message, details);
        displayError(errorObj);
        return errorObj;
    }
    
    // Try-catch wrapper for functions
    function tryCatch(fn, errorCode, errorMessage) {
        return function(...args) {
            try {
                return fn(...args);
            } catch (error) {
                return handleError(errorCode, errorMessage, error.message);
            }
        };
    }
    
    // Public API
    return {
        ERROR_CODES: ERROR_CODES,
        handleError: handleError,
        tryCatch: tryCatch
    };
})();
