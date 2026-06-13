"use strict";
// listings.js — This file handles everything to do with individual sale listings.
// It lets users post a new sale, edit or delete one they already posted, and view
// the full details of any listing. It also checks that the form is filled out
// correctly before submitting, handles uploading and cropping photos, and powers
// the search bar and category filters.

function deleteListing(id) {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    const idx = listings.findIndex(l => l.id === id);
    if (idx !== -1) listings.splice(idx, 1);
    filteredListings = filteredListings.filter(l => l.id !== id);
    myListingIds.delete(id);
    endedSaleIds.delete(id);
    saveUserData();
    updateCategoryCounts();
    renderFeaturedListings();
    renderNearbyListings();
    renderMapPins();
    renderMapSidebar();
    refreshMainMarkers();
    renderMenuDrawer();
    showToast('🗑️ Listing deleted');
    showPage('nearby');
}
// ============================================================
// RENDER LISTING CARD
// ============================================================

function toggleNearbyCategory(cat) {
    if (selectedCategories.has(cat)) {
        selectedCategories.delete(cat);
    } else {
        selectedCategories.add(cat);
    }
    ['yard', 'estate', 'garage'].forEach(c => {
        const btn = document.getElementById('nearby-cat-' + c);
        if (btn) btn.classList.toggle('active', selectedCategories.has(c));
    });
    renderNearbyPage();
}
function setDistance(d, btn) {
    currentDistance = d;
    document.querySelectorAll('.dist-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderNearbyPage();
}
function setView(view) {
    currentView = view;
    const cardsView = document.getElementById('nearbyCardsView');
    const mapView = document.getElementById('nearbyMapView');
    const cardBtn = document.getElementById('cardViewBtn');
    const mapBtn = document.getElementById('mapViewBtn');
    if (view === 'cards') {
        cardsView === null || cardsView === void 0 ? void 0 : cardsView.classList.remove('hidden');
        mapView === null || mapView === void 0 ? void 0 : mapView.classList.add('hidden');
        cardBtn === null || cardBtn === void 0 ? void 0 : cardBtn.classList.add('active');
        mapBtn === null || mapBtn === void 0 ? void 0 : mapBtn.classList.remove('active');
    }
    else {
        cardsView === null || cardsView === void 0 ? void 0 : cardsView.classList.add('hidden');
        mapView === null || mapView === void 0 ? void 0 : mapView.classList.remove('hidden');
        cardBtn === null || cardBtn === void 0 ? void 0 : cardBtn.classList.remove('active');
        mapBtn === null || mapBtn === void 0 ? void 0 : mapBtn.classList.add('active');
        initNearbyMap();
    }
}
// ============================================================
// MAP SIDEBAR
// ============================================================

function toggleMapCategory(cat) {
    if (selectedMapCategories.has(cat)) selectedMapCategories.delete(cat);
    else selectedMapCategories.add(cat);
    ['yard', 'estate', 'garage'].forEach(c => {
        const btn = document.getElementById('map-cat-' + c);
        if (btn) btn.classList.toggle('active', selectedMapCategories.has(c));
    });
    currentMapCategory = selectedMapCategories.size === 1 ? [...selectedMapCategories][0] : '';
    refreshMainMarkers();
    // Also filters the sidebar cards.
    const el = document.getElementById('mapSidebarListings');
    if (!el) return;
    const sidebarList = selectedMapCategories.size > 0
        ? listings.filter(l => selectedMapCategories.has(l.category))
        : listings;
    el.innerHTML = sidebarList.map(l => {
        const img = l.photos.length > 0
            ? `<img src="${l.photos[0]}" alt="${l.title}" loading="lazy" />`
            : `<div style="text-align:center;font-size:1.5rem">${categoryEmoji(l.category)}</div>`;
        return `
      <div class="sidebar-card" onclick="showDetail('${l.id}')">
        <div class="sidebar-card-img">${img}</div>
        <div class="sidebar-card-info">
          <div class="sidebar-card-title">${l.title}</div>
          <div class="sidebar-card-meta">${l.city} · ${categoryLabel(l.category)}</div>
        </div>
      </div>
    `;
    }).join('');
}
// ============================================================
// LISTING DETAIL
// ============================================================

function showDetail(id) {
    const listing = listings.find(l => l.id === id);
    if (!listing)
        return;
    // Remember which page we came from so "Back" returns there
    const active = document.querySelector('.page.active');
    if (active && active.id !== 'page-detail')
        previousPage = active.id.replace('page-', '');
    currentDetailId = id;
    const isFav = favorites.has(id);
    const mainPhoto = listing.photos[0] || '';
    const discountHtml = listing.discount
        ? `<span class="badge badge-discount" style="padding:.4rem 1rem;font-size:.85rem">🔥 ${listing.discount}% OFF</span>`
        : '';
    const thumbsHtml = listing.photos.map((p, i) => `
    <div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="switchGalleryPhoto('${p}', this)">
      <img src="${p}" alt="Photo ${i + 1}" loading="lazy" />
    </div>
  `).join('');
    const dateRange = listing.startDate === listing.endDate
        ? formatDate(listing.startDate)
        : `${formatDate(listing.startDate)} – ${formatDate(listing.endDate)}`;
    const content = `
    <div class="detail-back" onclick="showPage('${previousPage}')">← Back to listings</div>
    <div class="detail-grid">
      <div>
        <div class="detail-gallery">
          <div class="detail-gallery-main" id="galleryMain">
            ${mainPhoto ? `<img src="${mainPhoto}" alt="${listing.title}" id="mainGalleryImg" />` : `<div class="card-img-placeholder" style="height:400px">${categoryEmoji(listing.category)}</div>`}
          </div>
          ${listing.photos.length > 1 ? `<div class="detail-gallery-thumbs">${thumbsHtml}</div>` : ''}
        </div>
      </div>
      <div class="detail-info">
        <div class="detail-badges">
          <span class="badge badge-${listing.category}" style="padding:.4rem 1rem;font-size:.85rem">${categoryEmoji(listing.category)} ${categoryLabel(listing.category)}</span>
          ${discountHtml}
        </div>
        <h1 class="detail-title">${listing.title}</h1>
        <p class="detail-desc">${listing.description}</p>
        <div class="detail-meta-block">
          <div class="detail-meta-row">
            <span class="detail-meta-icon">📅</span>
            <div class="detail-meta-text">
              <strong>Date</strong>
              <span>${dateRange}</span>
            </div>
          </div>
          <div class="detail-meta-row">
            <span class="detail-meta-icon">🕐</span>
            <div class="detail-meta-text">
              <strong>Hours</strong>
              <span>${formatTime(listing.startTime)} – ${formatTime(listing.endTime)}</span>
            </div>
          </div>
          <div class="detail-meta-row">
            <span class="detail-meta-icon">📍</span>
            <div class="detail-meta-text">
              <strong>Address</strong>
              <span>${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}</span>
            </div>
          </div>
          ${listing.distance ? `
          <div class="detail-meta-row">
            <span class="detail-meta-icon">🚗</span>
            <div class="detail-meta-text">
              <strong>Distance</strong>
              <span>${listing.distance} miles from you</span>
            </div>
          </div>` : ''}
        </div>
        <div class="detail-actions">
          <button class="btn btn-primary" onclick="openDirections('${listing.address}, ${listing.city}, ${listing.state}')">🗺️ Get Directions</button>
          <button class="btn btn-ghost ${isFav ? 'active' : ''}" id="detailFavBtn" onclick="toggleFavoriteDetail('${listing.id}')">
            ${isFav ? '♥ Saved' : '♥ Save'}
          </button>
          <button class="btn btn-ghost" onclick="shareListing('${listing.title}')">↗️ Share</button>
        </div>
        ${listing.sellerName ? `
        <div class="seller-info">
          <div class="seller-info-title">Seller Information</div>
          <div class="seller-row"><span>👤</span><span>${listing.sellerName}</span></div>
          <div class="seller-row"><span>📞</span><span>${listing.sellerContact || 'Contact not provided'}</span></div>
        </div>` : ''}
        ${listing.id.startsWith('user-') ? `
        <div class="detail-manage-bar">
          <span class="manage-label">⚙️ Your Listing</span>
          <button class="btn btn-ghost" onclick="editListing('${listing.id}')">✏️ Edit</button>
          <button class="btn btn-ghost" onclick="endSale('${listing.id}')">${endedSaleIds.has(listing.id) ? '✅ Reopen Sale' : '🚫 End Sale'}</button>
          <button class="btn btn-ghost" onclick="showDeleteConfirm('${listing.id}')">🗑️ Delete</button>
        </div>` : ''}
        <div class="detail-map">
          <div class="map-placeholder" id="detailMiniMap" style="height:200px;border-radius:var(--radius-lg)">
            <div class="map-overlay">
              <small>📍 ${listing.address}, ${listing.city}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
    const detailContent = document.getElementById('detailContent');
    if (detailContent)
        detailContent.innerHTML = content;
    initDetailMiniMap(listing);
    showPage('detail');
}

function switchGalleryPhoto(src, thumb) {
    const mainImg = document.getElementById('mainGalleryImg');
    if (mainImg)
        mainImg.src = src;
    document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
}
function openDirections(address) {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
}
function shareListing(title) {
    if (navigator.share) {
        navigator.share({ title: title, url: window.location.href });
    }
    else {
        navigator.clipboard.writeText(window.location.href);
        showToast('🔗 Link copied to clipboard!');
    }
}
// ============================================================
// FAVORITES
// ============================================================

function toggleFavorite(event, id) {
    event.stopPropagation();
    if (favorites.has(id)) {
        favorites.delete(id);
        showToast('Removed from saved listings');
    }
    else {
        favorites.add(id);
        showToast('❤️ Added to saved listings!');
    }
    saveFavorites();
    updateFavCount();
    // If on the favorites page and item was removed, re-render so it disappears
    const favPage = document.getElementById('page-favorites');
    if (favPage && favPage.classList.contains('active') && !favorites.has(id)) {
        renderFavoritesPage();
    }
    // Always update hearts on every rendered card across all pages
    document.querySelectorAll(`.listing-card`).forEach(card => {
        const onclick = card.getAttribute('onclick') || '';
        if (onclick.includes(`'${id}'`)) {
            const btn = card.querySelector('.fav-btn');
            if (btn) {
                btn.textContent = favorites.has(id) ? '♥' : '♡';
                btn.classList.toggle('active', favorites.has(id));
            }
        }
    });
}
function toggleFavoriteDetail(id) {
    if (favorites.has(id)) {
        favorites.delete(id);
        showToast('Removed from saved listings');
    }
    else {
        favorites.add(id);
        showToast('❤️ Added to saved listings!');
    }
    saveFavorites();
    updateFavCount();
    const btn = document.getElementById('detailFavBtn');
    if (btn) {
        btn.textContent = favorites.has(id) ? '♥ Saved' : '♥ Save';
        btn.classList.toggle('active', favorites.has(id));
    }
}

function applySearch() {
    var _a, _b, _c, _d;
    const query = ((_a = document.getElementById('heroSearch')) === null || _a === void 0 ? void 0 : _a.value.toLowerCase()) || '';
    const cat = ((_b = document.getElementById('catFilter')) === null || _b === void 0 ? void 0 : _b.value) || '';
    const date = ((_c = document.getElementById('dateFilter')) === null || _c === void 0 ? void 0 : _c.value) || '';
    const disc = parseInt((_d = document.getElementById('discFilter')) === null || _d === void 0 ? void 0 : _d.value) || 0;
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSat = (6 - dayOfWeek + 7) % 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysToSat);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    filteredListings = listings.filter(l => {
        if (query && !l.title.toLowerCase().includes(query) && !l.city.toLowerCase().includes(query) && !l.zip.includes(query))
            return false;
        if (selectedCategories.size > 0 && !selectedCategories.has(l.category))
            return false;
        if (disc && (!l.discount || l.discount < disc))
            return false;
        if (date === 'today') {
            const start = new Date(l.startDate + 'T12:00:00');
            if (start.toDateString() !== today.toDateString())
                return false;
        }
        if (date === 'weekend') {
            const start = new Date(l.startDate + 'T12:00:00');
            if (start.toDateString() !== saturday.toDateString() && start.toDateString() !== sunday.toDateString())
                return false;
        }
        return true;
    });
    showPage('nearby');
    const nearbyEl = document.getElementById('nearbyPageListings');
    if (nearbyEl) {
        nearbyEl.innerHTML = filteredListings.length > 0
            ? filteredListings.map((l, i) => renderCard(l, i)).join('')
            : '<p style="color:var(--text-3);padding:2rem 0;">No listings match your search.</p>';
    }
    showToast(`🔍 Found ${filteredListings.length} listing${filteredListings.length !== 1 ? 's' : ''}`);
}
function filterByCategory(cat) {
    selectedCategories.clear();
    selectedCategories.add(cat);
    ['yard', 'estate', 'garage'].forEach(c => {
        const btn = document.getElementById('nearby-cat-' + c);
        if (btn) btn.classList.toggle('active', selectedCategories.has(c));
    });
    showPage('nearby');
    renderNearbyPage();
}
// ============================================================
// CREATE LISTING
// ============================================================
// ---- CUSTOM TIME PICKER ----

function _buildPickerSelects(which) {
    const hourSel = document.getElementById(which + 'TimeHour');
    const minSel  = document.getElementById(which + 'TimeMin');
    if (!hourSel || !minSel) return;

    // For start time: block past hours/minutes if start date is today
    let minHour24 = 0, minMin = 0;
    if (which === 'start') {
        const startDate = document.getElementById('startDateInput')?.value;
        const today = new Date().toISOString().split('T')[0];
        if (startDate === today) {
            const now = new Date();
            minHour24 = now.getHours();
            minMin = Math.ceil(now.getMinutes() / 5) * 5;
            if (minMin >= 60) { minHour24++; minMin = 0; }
        }
    }
    const minAmPm = minHour24 >= 12 ? 'PM' : 'AM';
    const minHour12 = minHour24 % 12 || 12;

    hourSel.innerHTML = '';
    for (let h = 1; h <= 12; h++) {
        const ampm = timePickerState[which].ampm;
        const h24 = ampm === 'AM' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
        const blocked = which === 'start' && h24 < minHour24;
        if (blocked) continue;
        const o = document.createElement('option');
        o.value = h; o.textContent = String(h).padStart(2, '0');
        hourSel.appendChild(o);
    }

    const selectedHour = parseInt(hourSel.value) || 1;
    const selectedAmPm = timePickerState[which].ampm;
    const selectedH24 = selectedAmPm === 'AM' ? (selectedHour === 12 ? 0 : selectedHour) : (selectedHour === 12 ? 12 : selectedHour + 12);
    const isCurrentHour = which === 'start' && selectedH24 === minHour24;

    minSel.innerHTML = '';
    for (let m = 0; m < 60; m += 5) {
        if (isCurrentHour && m < minMin) continue;
        const o = document.createElement('option');
        o.value = m; o.textContent = String(m).padStart(2, '0');
        minSel.appendChild(o);
    }
}
function openTimePicker(which) {
    // Close the other picker if open
    const other = which === 'start' ? 'end' : 'start';
    document.getElementById(other + 'TimePanel').classList.remove('open');
    document.getElementById(other + 'TimeDisplay').classList.remove('open');

    const panel   = document.getElementById(which + 'TimePanel');
    const display = document.getElementById(which + 'TimeDisplay');
    const isOpen  = panel.classList.contains('open');
    if (isOpen) { panel.classList.remove('open'); display.classList.remove('open'); return; }

    _buildPickerSelects(which);
    const st = timePickerState[which];
    const hourSel = document.getElementById(which + 'TimeHour');
    const minSel  = document.getElementById(which + 'TimeMin');
    hourSel.value = st.hour;
    // snap minute to nearest 5
    minSel.value = Math.round(st.min / 5) * 5 % 60;
    document.getElementById(which + 'TimeAM').classList.toggle('active', st.ampm === 'AM');
    document.getElementById(which + 'TimePM').classList.toggle('active', st.ampm === 'PM');

    panel.classList.add('open');
    display.classList.add('open');
}
function setPickerAmPm(which, ampm) {
    timePickerState[which].ampm = ampm;
    document.getElementById(which + 'TimeAM').classList.toggle('active', ampm === 'AM');
    document.getElementById(which + 'TimePM').classList.toggle('active', ampm === 'PM');
    _buildPickerSelects(which);
}
function confirmTimePicker(which) {
    const hourSel = document.getElementById(which + 'TimeHour');
    const minSel  = document.getElementById(which + 'TimeMin');
    const st = timePickerState[which];
    st.hour = parseInt(hourSel.value);
    st.min  = parseInt(minSel.value);
    st.confirmed = true;

    // Convert to 24h for hidden input
    let h24 = st.hour % 12;
    if (st.ampm === 'PM') h24 += 12;
    const timeVal = String(h24).padStart(2, '0') + ':' + String(st.min).padStart(2, '0');
    document.getElementById(which + 'TimeInput').value = timeVal;

    // Update display label
    const displayLabel = st.hour + ':' + String(st.min).padStart(2, '0') + ' ' + st.ampm;
    const valEl = document.getElementById(which + 'TimeVal');
    valEl.textContent = displayLabel;
    valEl.classList.remove('time-picker-placeholder');

    // Close panel
    document.getElementById(which + 'TimePanel').classList.remove('open');
    document.getElementById(which + 'TimeDisplay').classList.remove('open');

    if (which === 'start') { validateStartTime(); validateEndTime(); }
    else { validateEndTime(); }
}

function cancelTimePicker(which) {
    document.getElementById(which + 'TimePanel').classList.remove('open');
    document.getElementById(which + 'TimeDisplay').classList.remove('open');
}
// Close pickers when clicking outside
document.addEventListener('click', function(e) {
    ['start', 'end'].forEach(which => {
        const wrap = document.getElementById(which + 'TimeWrap');
        if (wrap && !wrap.contains(e.target)) {
            document.getElementById(which + 'TimePanel').classList.remove('open');
            document.getElementById(which + 'TimeDisplay').classList.remove('open');
        }
    });
});

function validateStartDate() {
    const el = document.getElementById('startDateInput');
    const warn = document.getElementById('startDateWarning');
    if (!el || !warn) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = el.value ? new Date(el.value + 'T00:00:00') : null;
    const invalid = selected && selected < today;
    warn.classList.toggle('visible', !!invalid);
    el.setCustomValidity(invalid ? 'Start date cannot be in the past' : '');
    return !invalid;
}
function validateStartTime() {
    const dateEl = document.getElementById('startDateInput');
    const timeEl = document.getElementById('startTimeInput');
    const warn = document.getElementById('startTimeWarning');
    if (!dateEl || !timeEl || !warn) return true;
    const now = new Date();
    const todayStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
    const isToday = dateEl.value === todayStr;
    const nowTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const invalid = isToday && !!timeEl.value && timeEl.value < nowTime;
    warn.classList.toggle('visible', !!invalid);
    timeEl.setCustomValidity(invalid ? 'Start time cannot be in the past' : '');
    return !invalid;
}
function validateEndDate() {
    const start = document.getElementById('startDateInput');
    const end = document.getElementById('endDateInput');
    const warn = document.getElementById('endDateWarning');
    if (!start || !end || !warn) return true;
    const invalid = start.value && end.value && end.value < start.value;
    warn.classList.toggle('visible', !!invalid);
    if (invalid) end.setCustomValidity('End date cannot be before start date');
    else end.setCustomValidity('');
    return !invalid;
}
function validateEndTime() {
    const startDate = document.getElementById('startDateInput');
    const endDate = document.getElementById('endDateInput');
    const startTime = document.getElementById('startTimeInput');
    const endTime = document.getElementById('endTimeInput');
    const warn = document.getElementById('endTimeWarning');
    if (!startTime || !endTime || !warn) return true;
    // Skip if any field is missing — can't compare incomplete datetimes
    if (!startDate.value || !endDate.value || !startTime.value || !endTime.value) {
        warn.classList.remove('visible');
        endTime.setCustomValidity('');
        return true;
    }
    const startDT = new Date(startDate.value + 'T' + startTime.value);
    const endDT   = new Date(endDate.value   + 'T' + endTime.value);
    const invalid = endDT <= startDT;
    warn.classList.toggle('visible', invalid);
    if (invalid) endTime.setCustomValidity('End must be after start');
    else endTime.setCustomValidity('');
    return !invalid;
}
function resetCreateForm() {
    editingListingId = null;
    const btn = document.querySelector('#createForm button[type="submit"]');
    if (btn) btn.textContent = 'Publish Listing';
    const form = document.getElementById('createForm');
    if (form) form.reset();
    // Explicitly clear readonly address fields (form.reset relies on defaultValue)
    ['cityInput', 'stateInput', 'zipInput', 'latInput', 'lngInput'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    // Clear any lingering custom validity so second submission is never blocked
    ['startDateInput', 'startTimeInput', 'endDateInput', 'endTimeInput'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setCustomValidity('');
    });
    ['titleWarning','descriptionWarning','nameWarning','categoryWarning','contactError','addressWarning','startDateWarning', 'startTimeWarning', 'endDateWarning', 'endTimeWarning', 'photoWarning'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('visible');
    });
    setMinDates();
    // Discount UI
    const discountFields = document.getElementById('discountFields');
    if (discountFields) discountFields.classList.add('hidden');
    document.querySelectorAll('.discount-chip').forEach(c => c.classList.remove('selected'));
    // Photo / crop state
    photoFiles = [];
    coverPhotoIndex = 0;
    cropState = { x: 50, y: 50, zoom: 100 };
    selectedDiscount = null;
    // Reset time picker state and display
    timePickerState = {
        start: { hour: 12, min: 0, ampm: 'AM', confirmed: false },
        end:   { hour: 12, min: 0, ampm: 'AM', confirmed: false }
    };
    ['start', 'end'].forEach(which => {
        const valEl = document.getElementById(which + 'TimeVal');
        if (valEl) { valEl.textContent = 'Select time…'; valEl.classList.add('time-picker-placeholder'); }
        const panel = document.getElementById(which + 'TimePanel');
        const display = document.getElementById(which + 'TimeDisplay');
        if (panel) panel.classList.remove('open');
        if (display) display.classList.remove('open', 'invalid');
    });
    renderPhotoPreview();
}
function toggleDiscount() {
    const toggle = document.getElementById('discountToggle');
    const fields = document.getElementById('discountFields');
    if (fields)
        fields.classList.toggle('hidden', !toggle.checked);
}
function selectDiscount(event, pct) {
    selectedDiscount = pct;
    document.querySelectorAll('.discount-chip').forEach(c => c.classList.remove('selected'));
    if (event && event.target)
        event.target.classList.add('selected');
    document.getElementById('discountValue').value = pct.toString();
}
function validateField(inputId, warningId) {
    const val = document.getElementById(inputId)?.value.trim() || '';
    const warn = document.getElementById(warningId);
    if (warn) warn.classList.toggle('visible', val === '');
    return val !== '';
}
function setMinDates() {
    const today = new Date().toISOString().split('T')[0];
    const s = document.getElementById('startDateInput');
    const e = document.getElementById('endDateInput');
    if (s) s.min = today;
    if (e) e.min = today;
}
function validateContact() {
    const val = document.getElementById('sellerContactInput')?.value.trim() || '';
    const err = document.getElementById('contactError');
    if (!err) return true;
    const isEmail = val.includes('@');
    const digits = val.replace(/\D/g, '');
    const invalid = !isEmail && val.length > 0 && digits.length !== 10;
    err.classList.toggle('visible', invalid);
    return !invalid;
}

function submitListing(event) {
    event.preventDefault();
    const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const fieldChecks = [
        ['titleInput','titleWarning'],
        ['descriptionInput','descriptionWarning'],
        ['sellerNameInput','nameWarning'],
        ['categoryInput','categoryWarning'],
        ['addressInput','addressWarning'],
    ];
    let firstInvalid = null;
    for (const [inputId, warningId] of fieldChecks) {
        if (!validateField(inputId, warningId) && !firstInvalid) firstInvalid = inputId;
    }
    if (!validateContact() && !firstInvalid) firstInvalid = 'sellerContactInput';
    if (firstInvalid) {
        document.getElementById(firstInvalid)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    if (!get('startTimeInput')) { showToast('Please select a start time'); return; }
    if (!get('endTimeInput'))   { showToast('Please select an end time');   return; }
    const photoWarn = document.getElementById('photoWarning');
    if (photoFiles.length === 0) {
        if (photoWarn) photoWarn.classList.add('visible');
        document.getElementById('dropZone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    if (photoWarn) photoWarn.classList.remove('visible');
    if (!validateStartDate() || !validateStartTime() || !validateEndDate() || !validateEndTime()) return;
    // Duplicate address + same category check
    const newAddr = (get('addressInput') + ' ' + get('cityInput') + ' ' + get('stateInput')).toLowerCase().replace(/\s+/g, ' ').trim();
    const newCat  = get('categoryInput');
    const duplicate = listings.find(l => {
        const addr = (l.address + ' ' + l.city + ' ' + l.state).toLowerCase().replace(/\s+/g, ' ').trim();
        return addr === newAddr && l.category === newCat;
    });
    if (duplicate) {
        showToast('A ' + newCat + ' sale already exists at this address. Use a different category or address.');
        return;
    }
    const lat = parseFloat(get('latInput')) || DEFAULT_CENTER.lat;
    const lng = parseFloat(get('lngInput')) || DEFAULT_CENTER.lng;
    const discountPct = selectedDiscount || (get('discountValue') ? parseInt(get('discountValue')) : null);
    const dist = userLocation
        ? Math.round(distanceMiles(userLocation.lat, userLocation.lng, lat, lng) * 10) / 10
        : null;
    const newId = editingListingId || ('user-' + Date.now());
    const newListing = {
        id: newId,
        title: get('titleInput'),
        description: get('descriptionInput'),
        sellerName: get('sellerNameInput'),
        sellerContact: get('sellerContactInput'),
        category: get('categoryInput'),
        startDate: get('startDateInput'),
        endDate: get('endDateInput'),
        startTime: get('startTimeInput'),
        endTime: get('endTimeInput'),
        address: get('addressInput'),
        city: get('cityInput'),
        state: get('stateInput'),
        zip: get('zipInput'),
        lat,
        lng,
        photos: [...photoFiles],
        coverIndex: coverPhotoIndex,
        cropX: cropState.x,
        cropY: cropState.y,
        cropZoom: cropState.zoom,
        discount: discountPct,
        featured: true,
        distance: dist,
    };
    if (editingListingId) {
        const idx = listings.findIndex(l => l.id === editingListingId);
        if (idx >= 0) listings[idx] = newListing;
        editingListingId = null;
    } else {
        listings.unshift(newListing);
        myListingIds.add(newId);
    }
    filteredListings = [...listings];
    saveUserData();
    resetCreateForm();
    updateCategoryCounts();
    renderFeaturedListings();
    renderNearbyListings();
    renderMapPins();
    renderMapSidebar();
    refreshMainMarkers();
    showToast('🚀 Listing published successfully!');
    setTimeout(() => showPage('home'), 1500);
}
// ---- Photo upload ----

function handlePhotoUpload(event) {
    const input = event.target;
    if (!input.files)
        return;
    const files = Array.from(input.files).slice(0, 10 - photoFiles.length);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            var _a;
            photoFiles.push((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
            const pw = document.getElementById('photoWarning');
            if (pw) pw.classList.remove('visible');
            renderPhotoPreview();
        };
        reader.readAsDataURL(file);
    });
}
function renderPhotoPreview() {
    const grid = document.getElementById('photoPreviewGrid');
    if (!grid) return;
    if (coverPhotoIndex >= photoFiles.length) coverPhotoIndex = 0;
    grid.innerHTML = photoFiles.map((src, i) => {
        const isCover = i === coverPhotoIndex;
        return `
        <div class="photo-preview-item${isCover ? ' is-cover' : ''}">
          <img src="${src}" alt="Photo ${i + 1}" />
          ${isCover
            ? `<span class="photo-cover-badge">Cover</span>
               <button type="button" class="photo-adjust-btn" onclick="openCropModal(${i})">✎ Adjust</button>`
            : `<button type="button" class="photo-set-cover-btn" onclick="setCoverPhoto(${i})">Set as Cover</button>`}
          <button type="button" class="photo-remove" onclick="removePhoto(${i})">✕</button>
        </div>`;
    }).join('');
}
function setCoverPhoto(index) {
    coverPhotoIndex = index;
    cropState = { x: 50, y: 50, zoom: 100 };
    renderPhotoPreview();
}
function removePhoto(index) {
    photoFiles.splice(index, 1);
    if (coverPhotoIndex >= photoFiles.length) coverPhotoIndex = Math.max(0, photoFiles.length - 1);
    else if (index < coverPhotoIndex) coverPhotoIndex--;
    renderPhotoPreview();
}
// ---- Crop modal ----
function openCropModal(index) {
    coverPhotoIndex = index;
    pendingCropState = { ...cropState };
    const img = document.getElementById('cropPreviewImg');
    if (img) img.src = photoFiles[index];
    const slider = document.getElementById('cropZoomSlider');
    if (slider) slider.value = pendingCropState.zoom;
    document.getElementById('cropZoomVal').textContent = (pendingCropState.zoom / 100).toFixed(1) + '×';
    applyCropPreview();
    document.getElementById('cropModalOverlay').classList.add('open');
    setupCropDrag();
}
function applyCropPreview() {
    const img = document.getElementById('cropPreviewImg');
    if (!img) return;
    img.style.objectPosition = `${pendingCropState.x}% ${pendingCropState.y}%`;
    img.style.transform = `scale(${pendingCropState.zoom / 100})`;
    img.style.transformOrigin = `${pendingCropState.x}% ${pendingCropState.y}%`;
}
function onCropZoom(val) {
    pendingCropState.zoom = parseInt(val);
    document.getElementById('cropZoomVal').textContent = (val / 100).toFixed(1) + '×';
    applyCropPreview();
}
function saveCrop() {
    cropState = { ...pendingCropState };
    document.getElementById('cropModalOverlay').classList.remove('open');
    teardownCropDrag();
    renderPhotoPreview();
}
function cancelCrop() {
    document.getElementById('cropModalOverlay').classList.remove('open');
    teardownCropDrag();
}
function setupCropDrag() {
    const wrap = document.getElementById('cropFrameWrap');
    if (!wrap) return;
    wrap.addEventListener('mousedown', onCropDragStart);
    wrap.addEventListener('touchstart', onCropTouchStart, { passive: false });
}
function teardownCropDrag() {
    const wrap = document.getElementById('cropFrameWrap');
    if (wrap) {
        wrap.removeEventListener('mousedown', onCropDragStart);
        wrap.removeEventListener('touchstart', onCropTouchStart);
    }
    document.removeEventListener('mousemove', onCropDragMove);
    document.removeEventListener('mouseup', onCropDragEnd);
    document.removeEventListener('touchmove', onCropTouchMove);
    document.removeEventListener('touchend', onCropDragEnd);
}
function onCropDragStart(e) {
    cropDragActive = true;
    cropDragStart = { x: e.clientX, y: e.clientY, px: pendingCropState.x, py: pendingCropState.y };
    document.addEventListener('mousemove', onCropDragMove);
    document.addEventListener('mouseup', onCropDragEnd);
}
function onCropTouchStart(e) {
    e.preventDefault();
    const t = e.touches[0];
    cropDragActive = true;
    cropDragStart = { x: t.clientX, y: t.clientY, px: pendingCropState.x, py: pendingCropState.y };
    document.addEventListener('touchmove', onCropTouchMove, { passive: false });
    document.addEventListener('touchend', onCropDragEnd);
}
function onCropDragMove(e) {
    if (!cropDragActive) return;
    const wrap = document.getElementById('cropFrameWrap');
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dx = e.clientX - cropDragStart.x;
    const dy = e.clientY - cropDragStart.y;
    // dragging right reveals left side of image → decrease x
    pendingCropState.x = Math.max(0, Math.min(100, cropDragStart.px - (dx / rect.width) * 100));
    pendingCropState.y = Math.max(0, Math.min(100, cropDragStart.py - (dy / rect.height) * 100));
    applyCropPreview();
}
function onCropTouchMove(e) {
    e.preventDefault();
    const t = e.touches[0];
    onCropDragMove({ clientX: t.clientX, clientY: t.clientY });
}
function onCropDragEnd() {
    cropDragActive = false;
    document.removeEventListener('mousemove', onCropDragMove);
    document.removeEventListener('mouseup', onCropDragEnd);
    document.removeEventListener('touchmove', onCropTouchMove);
    document.removeEventListener('touchend', onCropDragEnd);
}
// ---- Drop zone ----
function setupDropZone() {
    const zone = document.getElementById('dropZone');
    if (!zone)
        return;
    zone.addEventListener('click', (e) => {
        if (e.target.closest('label')) return; // label's for= already opens the picker
        const inp = document.getElementById('photoInput');
        if (inp) inp.click();
    });
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
        var _a;
        e.preventDefault();
        zone.classList.remove('dragover');
        if (!((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.files))
            return;
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 10 - photoFiles.length);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                var _a;
                photoFiles.push((_a = ev.target) === null || _a === void 0 ? void 0 : _a.result);
                renderPhotoPreview();
            };
            reader.readAsDataURL(file);
        });
    });
}
function setupAddressAutocomplete() {
    // Google Places Autocomplete is wired up in attachPlacesAutocomplete()
    // once the Maps script finishes loading. Nothing to do here until then.
}

// ============================================================
// ADDRESS AUTOCOMPLETE — powered by Google Places (see attachPlacesAutocomplete)
// ============================================================

function drawerUnfavorite(event, id) {
    toggleFavorite(event, id);
    renderMenuDrawer();
}
function drawerDeleteConfirm(id) {
    const item = document.getElementById('drawer-item-' + id);
    if (!item) return;
    item.innerHTML = `
        <div class="drawer-delete-confirm">
            <span>Delete this listing?</span>
            <div class="drawer-delete-actions">
                <button class="btn btn-primary" onclick="confirmDeleteListing('${id}')">Delete</button>
                <button class="btn btn-ghost" onclick="renderMenuDrawer()">Cancel</button>
            </div>
        </div>`;
}
function showDeleteConfirm(id) {
    const existing = document.getElementById('deleteConfirmBox');
    if (existing) { existing.remove(); return; }
    const manageBar = document.querySelector('.detail-manage-bar');
    if (!manageBar) return;
    const box = document.createElement('div');
    box.id = 'deleteConfirmBox';
    box.className = 'delete-confirm-box';
    box.innerHTML = `
        <p>Are you sure you want to delete this listing?</p>
        <div class="delete-confirm-actions">
            <button class="btn btn-primary" onclick="confirmDeleteListing('${id}')">Delete</button>
            <button class="btn btn-ghost" onclick="cancelDeleteListing()">Cancel</button>
        </div>`;
    manageBar.after(box);
}
function cancelDeleteListing() {
    const box = document.getElementById('deleteConfirmBox');
    if (box) box.remove();
}
function confirmDeleteListing(id) {
    const idx = listings.findIndex(l => l.id === id);
    if (idx !== -1) listings.splice(idx, 1);
    filteredListings = filteredListings.filter(l => l.id !== id);
    myListingIds.delete(id);
    endedSaleIds.delete(id);
    saveUserData();
    updateCategoryCounts();
    renderFeaturedListings();
    renderNearbyListings();
    renderMapPins();
    renderMapSidebar();
    refreshMainMarkers();
    renderMenuDrawer();
    showToast('🗑️ Listing deleted');
    showPage('nearby');
}

// ============================================================
// GOOGLE PLACES AUTOCOMPLETE
// ============================================================

// Great-circle distance in miles between two coordinates (haversine)

function endSale(id) {
    if (endedSaleIds.has(id)) {
        endedSaleIds.delete(id);
        showToast('✅ Sale reopened!');
    } else {
        endedSaleIds.add(id);
        showToast('🚫 Sale marked as ended');
    }
    saveUserData();
    showDetail(id);
}
function restoreTimePicker(which, timeStr) {
    if (!timeStr) return;
    const parts = timeStr.split(':');
    const h24 = parseInt(parts[0]);
    const min = parseInt(parts[1]) || 0;
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const hour = h24 % 12 || 12;
    timePickerState[which] = { hour, min, ampm, confirmed: true };
    const input = document.getElementById(which + 'TimeInput');
    if (input) input.value = timeStr;
    const valEl = document.getElementById(which + 'TimeVal');
    if (valEl) {
        valEl.textContent = hour + ':' + String(min).padStart(2, '0') + ' ' + ampm;
        valEl.classList.remove('time-picker-placeholder');
    }
    const amEl = document.getElementById(which + 'TimeAM');
    const pmEl = document.getElementById(which + 'TimePM');
    if (amEl) amEl.classList.toggle('active', ampm === 'AM');
    if (pmEl) pmEl.classList.toggle('active', ampm === 'PM');
}
function editListing(id) {
    const listing = listings.find(l => l.id === id);
    if (!listing) return;
    showPage('create');          // resets form first (clears editingListingId too)
    editingListingId = id;       // re-apply after the reset
    const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val || ''; };
    set('titleInput', listing.title);
    set('descriptionInput', listing.description);
    set('categoryInput', listing.category);
    set('startDateInput', listing.startDate);
    set('endDateInput', listing.endDate);
    set('addressInput', listing.address);
    set('cityInput', listing.city);
    set('stateInput', listing.state);
    set('zipInput', listing.zip);
    set('latInput', listing.lat);
    set('lngInput', listing.lng);
    set('sellerNameInput', listing.sellerName || '');
    set('sellerContactInput', listing.sellerContact || '');
    if (listing.discount) {
        const toggleEl = document.getElementById('discountToggle');
        if (toggleEl) { toggleEl.checked = true; toggleDiscount(); }
        set('discountValue', listing.discount);
    }
    // Restore photos and crop state
    photoFiles = [...(listing.photos || [])];
    coverPhotoIndex = listing.coverIndex || 0;
    cropState = { x: listing.cropX || 50, y: listing.cropY || 50, zoom: listing.cropZoom || 100 };
    renderPhotoPreview();
    // Restore time pickers
    restoreTimePicker('start', listing.startTime);
    restoreTimePicker('end', listing.endTime);
    const btn = document.querySelector('#createForm button[type="submit"]');
    if (btn) btn.textContent = 'Update Listing';
}

// Expose functions to window for HTML onclick attributes
window.showDetail = showDetail;
window.toggleFavorite = toggleFavorite;
window.toggleFavoriteDetail = toggleFavoriteDetail;
window.applySearch = applySearch;
window.filterByCategory = filterByCategory;
window.toggleNearbyCategory = toggleNearbyCategory;
window.setDistance = setDistance;
window.setView = setView;
window.toggleMapCategory = toggleMapCategory;
window.toggleDiscount = toggleDiscount;
window.selectDiscount = selectDiscount;
window.submitListing = submitListing;
window.handlePhotoUpload = handlePhotoUpload;
window.removePhoto = removePhoto;
window.switchGalleryPhoto = switchGalleryPhoto;
window.openDirections = openDirections;
window.shareListing = shareListing;
window.endSale = endSale;
window.deleteListing = deleteListing;
window.editListing = editListing;
window.showDeleteConfirm = showDeleteConfirm;
window.cancelDeleteListing = cancelDeleteListing;
window.confirmDeleteListing = confirmDeleteListing;
window.drawerDeleteConfirm = drawerDeleteConfirm;
window.drawerUnfavorite = drawerUnfavorite;
window.resetCreateForm = resetCreateForm;
window.validateStartDate = validateStartDate;
window.validateStartTime = validateStartTime;
window.validateEndDate = validateEndDate;
window.validateEndTime = validateEndTime;
window.openTimePicker = openTimePicker;
window.setPickerAmPm = setPickerAmPm;
window.confirmTimePicker = confirmTimePicker;
window.cancelTimePicker = cancelTimePicker;
window.setCoverPhoto = setCoverPhoto;
window.openCropModal = openCropModal;
window.onCropZoom = onCropZoom;
window.saveCrop = saveCrop;
window.cancelCrop = cancelCrop;
