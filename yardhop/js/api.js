"use strict";
// api.js — This file saves and loads data so nothing is lost when you refresh the page.
// It remembers which sales you posted, which ones you marked as favorites, and which
// sales you ended — all stored in your browser. It also has a placeholder ready to
// connect to a real server in the future when one is set up.

// ============================================================
// LIVE DATA
// ============================================================
async function loadListings() {
    if (!API_BASE) return; // backend not configured yet
    try {
        const data = await fetch(`${API_BASE}/listings`).then(r => r.json());
        listings.length = 0;
        data.forEach(l => listings.push(l));
        filteredListings = [...listings];
    } catch (err) {
        console.error('YardHop: failed to load listings —', err);
    }
}
// ============================================================
// SAVE ALL LISTINGS (for future backend sync)
// ============================================================
function saveListings() {
    localStorage.setItem('yardhop-user-listings', JSON.stringify(listings.filter(l => l.id.startsWith('user-'))));
}

// ============================================================
// FAVORITES
// ============================================================
function loadFavorites() {
    const saved = localStorage.getItem('yardhop-favorites');
    if (saved)
        favorites = new Set(JSON.parse(saved));
}
function saveFavorites() {
    localStorage.setItem('yardhop-favorites', JSON.stringify([...favorites]));
}

function loadUserData() {
    try {
        const ids = localStorage.getItem('yardhop-my-ids');
        if (ids) myListingIds = new Set(JSON.parse(ids));
        const ended = localStorage.getItem('yardhop-ended-sales');
        if (ended) endedSaleIds = new Set(JSON.parse(ended));
        const saved = localStorage.getItem('yardhop-user-listings');
        if (saved) {
            const userListings = JSON.parse(saved);
            userListings.forEach(l => { if (!listings.find(m => m.id === l.id)) listings.unshift(l); });
            filteredListings = [...listings];
        }
    } catch(e) {}
}
function saveUserData() {
    const userListings = listings.filter(l => myListingIds.has(l.id));
    localStorage.setItem('yardhop-my-ids', JSON.stringify([...myListingIds]));
    localStorage.setItem('yardhop-ended-sales', JSON.stringify([...endedSaleIds]));
    localStorage.setItem('yardhop-user-listings', JSON.stringify(userListings));
}
