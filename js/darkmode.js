/**
 * Dark Mode Toggle - OriginX
 * Handles theme switching with localStorage persistence
 */

(function () {
    'use strict';

    // Constants
    const THEME_KEY = 'originx-theme';
    const DARK_CLASS = 'dark-mode';

    /**
     * Get the user's saved theme preference
     * @returns {string|null} 'dark', 'light', or null
     */
    function getSavedTheme() {
        return localStorage.getItem(THEME_KEY);
    }

    /**
     * Save theme preference to localStorage
     * @param {string} theme - 'dark' or 'light'
     */
    function saveTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
    }

    /**
     * Apply dark mode to the document
     */
    function enableDarkMode() {
        document.body.classList.add(DARK_CLASS);
        saveTheme('dark');
    }

    /**
     * Remove dark mode from the document
     */
    function disableDarkMode() {
        document.body.classList.remove(DARK_CLASS);
        saveTheme('light');
    }

    /**
     * Toggle between dark and light mode
     */
    function toggleTheme() {
        if (document.body.classList.contains(DARK_CLASS)) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    }

    /**
     * Initialize theme based on saved preference or system preference
     */
    function initializeTheme() {
        const savedTheme = getSavedTheme();

        if (savedTheme === 'dark') {
            // User previously selected dark mode
            document.body.classList.add(DARK_CLASS);
        } else if (savedTheme === 'light') {
            // User previously selected light mode
            document.body.classList.remove(DARK_CLASS);
        } else {
            // No saved preference - check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.body.classList.add(DARK_CLASS);
            }
        }
    }

    /**
     * Set up the toggle button event listener
     */
    function setupToggleButton() {
        const toggleBtn = document.getElementById('theme-toggle');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function (e) {
                e.preventDefault();
                toggleTheme();
            });
        }
    }

    /**
     * Listen for system theme changes
     */
    function listenForSystemThemeChanges() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', function (e) {
            // Only auto-switch if user hasn't set a preference
            if (!getSavedTheme()) {
                if (e.matches) {
                    document.body.classList.add(DARK_CLASS);
                } else {
                    document.body.classList.remove(DARK_CLASS);
                }
            }
        });
    }

    // Initialize immediately to prevent flash of wrong theme
    initializeTheme();

    // Set up event listeners when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setupToggleButton();
            listenForSystemThemeChanges();
        });
    } else {
        setupToggleButton();
        listenForSystemThemeChanges();
    }

    // Expose functions globally if needed
    window.OriginXTheme = {
        toggle: toggleTheme,
        enableDark: enableDarkMode,
        disableLight: disableDarkMode,
        getSavedTheme: getSavedTheme
    };
})();
