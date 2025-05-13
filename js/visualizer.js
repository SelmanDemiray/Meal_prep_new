/**
 * Visualization Helper Module
 * Provides additional visualization capabilities for charts and graphs
 */

const Visualizer = (function() {
    /**
     * Create a tooltip element for charts
     * @param {string} text - The tooltip text
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {HTMLElement} The tooltip element
     */
    function createTooltip(text, x, y) {
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.textContent = text;
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        
        return tooltip;
    }
    
    /**
     * Calculate suitable tick values for a chart axis
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {number} count - Number of ticks desired
     * @returns {Array} Array of tick values
     */
    function calculateTicks(min, max, count = 5) {
        // Handle special cases
        if (min === max) {
            return [min];
        }
        
        // Calculate tick step
        const range = max - min;
        const step = Math.pow(10, Math.floor(Math.log10(range / count)));
        const normalizedStep = Math.ceil(range / (count * step)) * step;
        
        // Generate ticks
        const ticks = [];
        const start = Math.floor(min / normalizedStep) * normalizedStep;
        
        for (let i = 0; i <= count + 1; i++) {
            const value = start + i * normalizedStep;
            if (value >= min && value <= max) {
                ticks.push(value);
            }
        }
        
        return ticks;
    }
    
    /**
     * Format a number for display (add commas, limit decimals)
     * @param {number} value - The number to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted number
     */
    function formatNumber(value, decimals = 0) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    }
    
    /**
     * Format a currency value for display
     * @param {number} value - The value to format
     * @returns {string} Formatted currency string
     */
    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    }
    
    /**
     * Calculate statistics for an array of values
     * @param {Array} values - Array of numeric values
     * @returns {Object} Statistics object with min, max, avg, sum, etc.
     */
    function calculateStats(values) {
        if (!values || values.length === 0) {
            return { min: 0, max: 0, avg: 0, sum: 0, count: 0 };
        }
        
        const sum = values.reduce((total, val) => total + val, 0);
        const validValues = values.filter(val => !isNaN(val) && val !== null);
        
        return {
            min: Math.min(...validValues),
            max: Math.max(...validValues),
            avg: sum / validValues.length,
            sum: sum,
            count: validValues.length
        };
    }
    
    /**
     * Generate a color gradient between two colors
     * @param {string} startColor - Starting color in hex format
     * @param {string} endColor - Ending color in hex format
     * @param {number} steps - Number of steps in the gradient
     * @returns {Array} Array of hex color strings
     */
    function generateColorGradient(startColor, endColor, steps) {
        // Convert hex to RGB
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }
        
        // Convert RGB to hex
        function rgbToHex(r, g, b) {
            return '#' + [r, g, b].map(x => {
                const hex = Math.round(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        }
        
        // Get RGB values
        const start = hexToRgb(startColor);
        const end = hexToRgb(endColor);
        
        // Generate gradient
        const colors = [];
        for (let i = 0; i < steps; i++) {
            const r = start.r + ((end.r - start.r) * i / (steps - 1));
            const g = start.g + ((end.g - start.g) * i / (steps - 1));
            const b = start.b + ((end.b - start.b) * i / (steps - 1));
            colors.push(rgbToHex(r, g, b));
        }
        
        return colors;
    }
    
    // Public API
    return {
        createTooltip,
        calculateTicks,
        formatNumber,
        formatCurrency,
        calculateStats,
        generateColorGradient
    };
})();
