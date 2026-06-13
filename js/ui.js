"use strict";
// ui.js — This file controls what the user sees on screen.
// It builds all the sale cards you browse through, updates the count badges on each
// category, fills in the Nearby and Favorites pages, populates the sidebar on the
// map page, and builds the slide-out menu. It also has small helpers that format
// dates and times into readable text like "Jun 12, 2026" and "9:00 AM".

function categoryEmoji(cat) {
    if (cat === 'yard')
        return '🌳';
    if (cat === 'garage')
        return '🧰';
    if (cat === 'estate')
        return '🪞';
    return '🏷️';
}
function categoryLabel(cat) {
    if (cat === 'yard')
        return 'Yard Sale';
    if (cat === 'garage')
        return 'Garage Sale';
    if (cat === 'estate')
        return 'Estate Sale';
    return cat;
}
function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
}
function renderCard(listing, stagger = 0) {
    const isFav = favorites.has(listing.id);
    const isEnded = endedSaleIds.has(listing.id);
    let imgHtml;
    if (listing.photos.length > 0) {
        const idx = listing.coverIndex || 0;
        const src = listing.photos[Math.min(idx, listing.photos.length - 1)];
        const ox = listing.cropX !== undefined ? listing.cropX : 50;
        const oy = listing.cropY !== undefined ? listing.cropY : 50;
        const scale = listing.cropZoom !== undefined ? listing.cropZoom / 100 : 1;
        const imgStyle = `object-position:${ox}% ${oy}%;transform:scale(${scale});transform-origin:${ox}% ${oy}%`;
        imgHtml = `<img src="${src}" alt="${listing.title}" loading="lazy" style="${imgStyle}" onerror="this.parentElement.innerHTML='<div class=\\'card-img-placeholder\\'>${categoryEmoji(listing.category)}</div>'" />`;
    } else {
        imgHtml = `<div class="card-img-placeholder">${categoryEmoji(listing.category)}</div>`;
    }
    const discountBadge = listing.discount
        ? `<span class="badge badge-discount"> ${listing.discount}% OFF</span>`
        : '';
    const dateRange = listing.startDate === listing.endDate
        ? formatDate(listing.startDate)
        : `${formatDate(listing.startDate)} – ${formatDate(listing.endDate)}`;
    return `
    <div class="listing-card${isEnded ? ' ended' : ''}" style="animation-delay:${stagger * 0.06}s" onclick="showDetail('${listing.id}')">
      <div class="card-img">
        ${imgHtml}
        <div class="card-badge-wrap">
          <span class="badge badge-${listing.category}">${categoryEmoji(listing.category)} ${categoryLabel(listing.category)}</span>
          ${discountBadge}
        </div>
        <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event,'${listing.id}')" aria-label="Save listing">
          ${isFav ? '♥' : '♡'}
        </button>
      </div>
      <div class="card-body">
        <div class="card-title">${listing.title}</div>
        <div class="card-meta">
          <span>📅 ${dateRange}</span>
          <span>🕐 ${formatTime(listing.startTime)} – ${formatTime(listing.endTime)}</span>
        </div>
        <div class="card-address">📍 ${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}</div>
        <div class="card-footer">
          <span class="card-distance">${listing.distance ? `${listing.distance} mi away` : ''}</span>
          <button class="btn-view">View Details →</button>
        </div>
      </div>
    </div>
  `;
}
// ============================================================
// HOME PAGE RENDERS
// ============================================================

function updateCategoryCounts() {
    const counts = { yard: 0, garage: 0, estate: 0 };
    listings.forEach(l => { if (counts[l.category] !== undefined) counts[l.category]++; });
    const set = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n + ' active'; };
    set('countYard', counts.yard);
    set('countGarage', counts.garage);
    set('countEstate', counts.estate);
}
function renderFeaturedListings() {
    const el = document.getElementById('featuredListings');
    if (!el) return;
    const featured = listings.filter(l => l.discount).sort((a, b) => (b.discount || 0) - (a.discount || 0)).slice(0, 4);
    el.innerHTML = featured.length > 0
        ? featured.map((l, i) => renderCard(l, i)).join('')
        : '<p style="color:var(--text-3);padding:1rem 0;">No discounted sales yet — sellers who offer a discount will appear here!</p>';
}
function renderNearbyListings() {
    const el = document.getElementById('nearbyListings');
    if (!el) return;
    const sorted = [...listings].sort((a, b) => (a.distance || 99) - (b.distance || 99)).slice(0, 4);
    el.innerHTML = sorted.length > 0
        ? sorted.map((l, i) => renderCard(l, i)).join('')
        : '<p style="color:var(--text-3);padding:1rem 0;">No nearby listings yet.</p>';
}
// ============================================================
// MAP PINS
// ============================================================

function renderMapPins() {
    const container = document.getElementById('mapPins');
    if (!container)
        return;
    const positions = [
        { left: '20%', top: '35%', cat: 'yard' },
        { left: '45%', top: '55%', cat: 'garage' },
        { left: '65%', top: '25%', cat: 'estate' },
        { left: '35%', top: '70%', cat: 'yard' },
        { left: '75%', top: '60%', cat: 'garage' },
        { left: '55%', top: '40%', cat: 'estate' },
    ];
    container.innerHTML = positions.map(p => `
    <div class="map-pin pin-${p.cat}" style="left:${p.left};top:${p.top}">
      <span class="map-pin-inner">${categoryEmoji(p.cat)}</span>
    </div>
  `).join('');
    // Full map pins
    const fullPins = document.getElementById('fullMapPins');
    if (fullPins) {
        fullPins.innerHTML = listings.map(l => {
            const left = 15 + Math.abs(l.lng + 97.8) * 300 % 70;
            const top = 10 + Math.abs(l.lat - 30.1) * 200 % 75;
            return `<div class="map-pin pin-${l.category}" style="left:${left}%;top:${top}%" title="${l.title}" onclick="showDetail('${l.id}')">
        <span class="map-pin-inner">${categoryEmoji(l.category)}</span>
      </div>`;
        }).join('');
    }
}
// ============================================================
// NEARBY PAGE
// ============================================================

function renderNearbyPage() {
    const el = document.getElementById('nearbyPageListings');
    if (!el)
        return;
    const sortEl = document.getElementById('nearbySortSelect');
    const sort = sortEl ? sortEl.value : 'distance';
    const nearby = listings
        .filter(l => currentDistance === 50 ? (l.distance || 0) >= 50 : (l.distance || 0) <= currentDistance)
        .filter(l => selectedCategories.size === 0 || selectedCategories.has(l.category))
        .sort((a, b) => {
            if (sort === 'date') return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            if (sort === 'newest') return listings.indexOf(b) - listings.indexOf(a);
            return (a.distance || 99) - (b.distance || 99);
        });
    el.innerHTML = nearby.length > 0
        ? nearby.map((l, i) => renderCard(l, i)).join('')
        : '<p style="color:var(--text-3);padding:2rem 0;">No sales found within this distance.</p>';
}

function renderMapSidebar() {
    const el = document.getElementById('mapSidebarListings');
    if (!el)
        return;
    el.innerHTML = listings.map(l => {
        const img = l.photos.length > 0
            ? `<img src="${l.photos[0]}" alt="${l.title}" loading="lazy" onerror="this.style.display='none'" />`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem">${categoryEmoji(l.category)}</div>`;
        return `
      <div class="sidebar-card" onclick="showDetail('${l.id}')">
        <div class="sidebar-card-img">${img}</div>
        <div class="sidebar-card-info">
          <div class="sidebar-card-title">${l.title}</div>
          <div class="sidebar-card-meta">${l.city} · ${l.distance ? l.distance + ' mi' : categoryLabel(l.category)}</div>
        </div>
      </div>
    `;
    }).join('');
}

function renderMenuDrawer() {
    const body = document.getElementById('menuDrawerBody');
    if (!body) return;
    // Nav links (for mobile where bottom nav may not cover all pages)
    const navHtml = `
      <div class="drawer-section drawer-login-btn" style="padding-bottom:.75rem">
        <button class="btn btn-primary" style="width:100%;justify-content:center;font-size:.95rem;padding:.75rem" onclick="closeMenuDrawer();showPage('login')">Log In / Sign Up</button>
      </div>
      <div class="drawer-nav-links">
        <button class="drawer-nav-link" onclick="closeMenuDrawer();showPage('home')">🏠 Home</button>
        <button class="drawer-nav-link" onclick="closeMenuDrawer();showPage('nearby')">🔍 Nearby</button>
        <button class="drawer-nav-link" onclick="closeMenuDrawer();showPage('map')">🗺️ Map</button>
        <button class="drawer-nav-link" onclick="closeMenuDrawer();showPage('favorites')">❤️ Favorites</button>
      </div>`;
    const coverThumb = l => {
        if (!l.photos.length) return categoryEmoji(l.category);
        const idx = Math.min(l.coverIndex || 0, l.photos.length - 1);
        const ox = l.cropX !== undefined ? l.cropX : 50;
        const oy = l.cropY !== undefined ? l.cropY : 50;
        const scale = l.cropZoom !== undefined ? l.cropZoom / 100 : 1;
        return `<img src="${l.photos[idx]}" alt="${l.title}" style="object-position:${ox}% ${oy}%;transform:scale(${scale});transform-origin:${ox}% ${oy}%" />`;
    };
    // My Listings
    const myListings = listings.filter(l => l.id.startsWith('user-'));
    const myHtml = myListings.length === 0
        ? '<p class="drawer-empty">No listings yet.</p>'
        : myListings.map(l => `
            <div class="drawer-listing-item" id="drawer-item-${l.id}">
              <div class="drawer-listing-thumb" onclick="closeMenuDrawer();showDetail('${l.id}')">${coverThumb(l)}</div>
              <div class="drawer-listing-info" onclick="closeMenuDrawer();showDetail('${l.id}')">
                <div class="drawer-listing-title">${l.title}</div>
                <div class="drawer-listing-meta">${formatDate(l.startDate)}${l.city ? ' · ' + l.city : ''}</div>
              </div>
              <button type="button" class="drawer-delete-btn" onclick="drawerDeleteConfirm('${l.id}')" title="Delete">🗑</button>
            </div>`).join('');
    // Favorited
    const favListings = listings.filter(l => favorites.has(l.id));
    const favHtml = favListings.length === 0
        ? '<p class="drawer-empty">Tap ♥ on any listing to save it.</p>'
        : favListings.map(l => `
            <div class="drawer-listing-item">
              <div class="drawer-listing-thumb" onclick="closeMenuDrawer();showDetail('${l.id}')">${coverThumb(l)}</div>
              <div class="drawer-listing-info" onclick="closeMenuDrawer();showDetail('${l.id}')">
                <div class="drawer-listing-title">${l.title}</div>
                <div class="drawer-listing-meta">${formatDate(l.startDate)}${l.city ? ' · ' + l.city : ''}</div>
              </div>
              <button type="button" class="drawer-unfav-btn" onclick="drawerUnfavorite(event,'${l.id}')" title="Unfavorite">❤️</button>
            </div>`).join('');
    const pushSupported = 'Notification' in window;
    const pushOn = pushSupported && localStorage.getItem('yardhop-push') === 'on' && Notification.permission === 'granted';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const settingsHtml = `
      <div class="drawer-section">
        <div class="drawer-section-title">Settings</div>
        <div class="drawer-toggle-row">
          <div>
            <div class="drawer-toggle-label">Dark Mode</div>
          </div>
          <label class="toggle-label" style="margin:0">
            <input type="checkbox" ${isDark ? 'checked' : ''} onchange="toggleTheme()" />
            <span class="toggle-switch"></span>
          </label>
        </div>
        ${pushSupported ? `
        <div class="drawer-toggle-row" style="margin-top:.75rem">
          <div>
            <div class="drawer-toggle-label">Push Notifications</div>
            <div class="drawer-toggle-sub">Get alerts for new sales near you</div>
          </div>
          <label class="toggle-label" style="margin:0">
            <input type="checkbox" id="pushToggle" ${pushOn ? 'checked' : ''} onchange="togglePushNotifications(this.checked)" />
            <span class="toggle-switch"></span>
          </label>
        </div>` : ''}
      </div>`;
    body.innerHTML = `
      ${navHtml}
      ${settingsHtml}
      <div class="drawer-section">
        <div class="drawer-section-title">My Listings</div>
        ${myHtml}
      </div>
      <div class="drawer-section">
        <div class="drawer-section-title">My Favorites</div>
        ${favHtml}
      </div>
      `;
}

function updateFavCount() {
    const el = document.getElementById('favCount');
    if (el) {
        el.textContent = favorites.size.toString();
        el.style.display = favorites.size > 0 ? 'inline-flex' : 'none';
    }
}

function renderFavoritesPage() {
    const el = document.getElementById('favoritesContent');
    if (!el)
        return;
    const favListings = listings.filter(l => favorites.has(l.id));
    if (favListings.length === 0) {
        el.innerHTML = `
      <div class="favorites-empty">
        <div class="empty-icon">🤍</div>
        <h3>No saved listings yet</h3>
        <p>Tap the heart icon on any listing to save it here</p>
        <br>
        <button class="btn btn-primary" onclick="showPage('home')">Browse Listings</button>
      </div>
    `;
        return;
    }
    el.innerHTML = `<div class="listings-grid">${favListings.map((l, i) => renderCard(l, i)).join('')}</div>`;
}
// ============================================================
// SEARCH & FILTERS
// ============================================================

// Expose functions to window for HTML onclick attributes
window.renderMenuDrawer = renderMenuDrawer;

// ============================================================
// AUTH PAGE
// ============================================================

function switchAuthPanel(panel) {
    const loginEl = document.getElementById('authLogin');
    const signupEl = document.getElementById('authSignup');
    if (panel === 'signup') {
        loginEl.classList.add('hidden');
        signupEl.classList.remove('hidden');
    } else {
        signupEl.classList.add('hidden');
        loginEl.classList.remove('hidden');
    }
}

function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function isValidPhone(val) {
    return /^[\+]?[\d\s\-().]{7,15}$/.test(val);
}

function showLoginError() {
    const el = document.getElementById('loginError');
    if (el) el.classList.remove('hidden');
}

function clearLoginError() {
    const el = document.getElementById('loginError');
    if (el) el.classList.add('hidden');
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password || (!isValidEmail(email) && !isValidPhone(email))) {
        showLoginError();
        return;
    }
    clearLoginError();
    // Placeholder — wire up your real auth here
    showToast('Login coming soon!');
}

function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    if (!name || !email || !password || !confirm) {
        showToast('Please fill in all fields.');
        return;
    }
    if (password !== confirm) {
        showToast('Passwords do not match.');
        return;
    }
    // Placeholder — wire up your real auth here
    showToast('Sign up coming soon!');
}

function clearForgotError() {
    const el = document.getElementById('forgotError');
    if (el) el.classList.add('hidden');
}

function handleForgotPassword() {
    const val = document.getElementById('forgotContact').value.trim();
    if (!val || (!isValidEmail(val) && !isValidPhone(val))) {
        const el = document.getElementById('forgotError');
        if (el) el.classList.remove('hidden');
        return;
    }
    clearForgotError();
    // Placeholder — wire up your real password-reset flow here
    showToast('Reset link sent! Check your email or phone.');
    showPage('login');
}

window.switchAuthPanel = switchAuthPanel;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.clearLoginError = clearLoginError;
window.clearForgotError = clearForgotError;
window.handleForgotPassword = handleForgotPassword;
