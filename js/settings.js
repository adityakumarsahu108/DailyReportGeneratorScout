"use strict";

/*
==========================================
Local Storage
==========================================
*/

const STORAGE_KEY = "dailyReportSettings";

// Legacy keys from the old implementation — read once for migration, then removed.
const LEGACY_KEYS = ["toContainer", "ccContainer", "generalSettings"];

const DEFAULT_SETTINGS = {
    to: [],
    cc: [],

};

// Single in-memory source of truth for the whole session.
let settings = { ...DEFAULT_SETTINGS };

/**
 * Migrates data from the old, scattered localStorage keys into the new
 * single "dailyReportSettings" object, then removes the legacy keys.
 * Safe to run every time — it's a no-op once migration has happened.
 */
function migrateLegacyStorage() {

    const alreadyMigrated = localStorage.getItem(STORAGE_KEY) !== null;

    if (alreadyMigrated) {
        // Still clean up any stray legacy keys left over from before.
        LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
        return;
    }

    const migrated = { ...DEFAULT_SETTINGS };

    try {
        const oldTo = JSON.parse(localStorage.getItem("toContainer") || "[]");
        const oldCc = JSON.parse(localStorage.getItem("ccContainer") || "[]");
        const oldGeneral = JSON.parse(localStorage.getItem("generalSettings") || "{}");

        migrated.to = Array.isArray(oldTo) ? oldTo : [];
        migrated.cc = Array.isArray(oldCc) ? oldCc : [];
        Object.assign(migrated, oldGeneral);
    } catch (err) {
        console.warn("Legacy settings could not be migrated, starting fresh.", err);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
}

/**
 * Loads settings from localStorage into memory, falling back to defaults
 * for any missing fields (keeps the app forward-compatible with new settings).
 */
function loadSettings() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        settings = { ...DEFAULT_SETTINGS, ...(stored || {}) };
    } catch (err) {
        console.error("Saved settings were corrupted, reverting to defaults.", err);
        settings = { ...DEFAULT_SETTINGS };
    }
    return settings;
}

/**
 * Persists the current in-memory settings object and shows the "saved" indicator.
 */
function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    showSavedIndicator();
}

/*
==========================================
Settings Panel
==========================================
*/

function initSettingsPanel() {

    const settingsBtn = document.getElementById("settingsBtn");
    const settingsOverlay = document.getElementById("settingsOverlay");
    const closeSettings = document.getElementById("closeSettings");

    if (!settingsBtn || !settingsOverlay || !closeSettings) {
        console.error("Settings panel elements not found.");
        return;
    }

    // Open panel
    settingsBtn.addEventListener("click", () => {
        settingsOverlay.classList.add("open");
    });

    // Close via × button
    closeSettings.addEventListener("click", () => {
        settingsOverlay.classList.remove("open");
    });

    // Close by clicking outside the panel
    settingsOverlay.addEventListener("click", (e) => {
        if (e.target === settingsOverlay) {
            settingsOverlay.classList.remove("open");
        }
    });
}

/*
==========================================
Recipient Chips
==========================================
*/

/**
 * Creates an Outlook/Gmail-style chip input bound directly to a property
 * on the central `settings` object (e.g. "to" or "cc").
 *
 * @param {string} containerId - id of the chip container element
 * @param {string} inputId - id of the text input element
 * @param {string} propertyName - key on `settings` this input manages (e.g. "to", "cc")
 */
function createChipInput(containerId, inputId, propertyName) {

    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);

    if (!container || !input) {
        console.error(`Chip input elements not found for #${containerId} / #${inputId}`);
        return { getEmails: () => [], addEmail: () => {} };
    }

    // Ensure the settings object always has an array for this property.
    if (!Array.isArray(settings[propertyName])) {
        settings[propertyName] = [];
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function renderChip(email) {

        const chip = document.createElement("div");
        chip.className = "recipient-chip";
        chip.innerHTML = `
            <span>${email}</span>
            <button type="button" aria-label="Remove ${email}">&times;</button>
        `;

        chip.querySelector("button").addEventListener("click", () => {
            removeEmail(email, chip);
        });

        container.insertBefore(chip, input);
    }

    function removeEmail(email, chipEl) {

        const list = settings[propertyName];
        const index = list.indexOf(email.toLowerCase());

        if (index > -1) {
            list.splice(index, 1);
        }

        chipEl.remove();
        saveSettings();
    }

    function removeLastChip() {

        const list = settings[propertyName];

        if (list.length === 0) return;

        const chips = container.querySelectorAll(".recipient-chip");
        const lastChip = chips[chips.length - 1];

        list.pop();

        if (lastChip) {
            lastChip.remove();
        }

        saveSettings();
    }

    function addEmail(rawEmail) {

        const email = (rawEmail || "").trim();

        if (email === "") return false;

        if (!isValidEmail(email)) {
            input.style.border = "1px solid red";
            return false;
        }

        input.style.border = "";

        const list = settings[propertyName];

        if (list.includes(email.toLowerCase())) {
            return false; // duplicate — silently ignore
        }

        list.push(email.toLowerCase());
        renderChip(email);
        saveSettings();

        return true;
    }

    // Enter to add, Backspace on empty input to remove the last chip
    input.addEventListener("keydown", (e) => {

        if (e.key === "Enter") {
            e.preventDefault();
            if (addEmail(input.value)) {
                input.value = "";
            }
            return;
        }

        if (e.key === "Backspace" && input.value === "") {
            removeLastChip();
        }
    });

    // Render any chips already stored in settings (page load / reload)
    settings[propertyName].forEach(email => renderChip(email));

    return {
        getEmails() {
            return [...settings[propertyName]];
        },
        addEmail
    };
}

/**
 * Shows the "✔ All changes saved" indicator and fades it out after ~2.5s.
 */
function showSavedIndicator() {

    const indicator = document.getElementById("settingsSaved");

    if (!indicator) return;

    indicator.textContent = "✔ All changes saved";
    indicator.style.opacity = 1;

    clearTimeout(indicator._fadeTimer);
    indicator._fadeTimer = setTimeout(() => {
        indicator.style.opacity = 0;
    }, 2500);
}

/*
==========================================
Public Helper Functions
==========================================
*/

/**
 * @returns {string[]} A copy of the saved "To" recipient list.
 */
function getToRecipients() {
    return [...settings.to];
}

/**
 * @returns {string[]} A copy of the saved "CC" recipient list.
 */
function getCCRecipients() {
    return [...settings.cc];
}

/**
 * @returns {object} A copy of the entire settings object.
 */
function getSettings() {
    return { ...settings };
}

/*
==========================================
Initialization
==========================================
*/

document.addEventListener("DOMContentLoaded", () => {

    migrateLegacyStorage();
    loadSettings();

    initSettingsPanel();

    createChipInput("toContainer", "toInput", "to");
    createChipInput("ccContainer", "ccInput", "cc");

});