"use strict";
// maps.js — This file powers all the maps in the app.
// It shows the small map preview on the home screen, the full map page, the tiny
// map on a listing's detail page, and the map on the Nearby screen. It places
// colored pins for each sale, groups pins together when there are lots of them,
// shows where you are on the map, calculates how far away each sale is from you,
// and fills in your address automatically when you type in the search box.

// ---- Map color themes (light = Google default, dark = custom) ----
const MAP_STYLE_LIGHT = [];
const MAP_STYLE_DARK = [
    { elementType: 'geometry', stylers: [{ color: '#212121' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];

function activeMapStyle() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;
}
function applyMapTheme() {
    const style = activeMapStyle();
    [homePreviewMap, mainMap, detailMap, nearbyMap].forEach(m => { if (m) m.setOptions({ styles: style }); });
}

// ---- Category-colored teardrop marker icon ----

function pinColor(cat) {
    if (cat === 'yard') return '#16a34a';
    if (cat === 'garage') return '#D4AF37';
    if (cat === 'estate') return '#7c3aed';
    return '#D4AF37';
}
function markerIcon(cat) {
    return {
        path: 'M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z',
        fillColor: pinColor(cat),
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.2,
        anchor: new google.maps.Point(12, 36),
    };
}
function userDot() {
    return { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#D4AF37', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3 };
}

// ---- Script loader ----

function loadGoogleMaps() {
    if (!GOOGLE_MAPS_API_KEY) {
        console.info('YardHop: no Google Maps API key set — maps disabled.');
        return;
    }
    if (window.google && window.google.maps) { onMapsReady(); return; }
    // Marker-clustering library (loads in parallel; optional — falls back gracefully)
    const cluster = document.createElement('script');
    cluster.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
    document.head.appendChild(cluster);
    // Main Maps + Places script; invokes window.onMapsReady when loaded
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=onMapsReady`;
    s.async = true;
    s.defer = true;
    s.onerror = () => console.error('YardHop: Google Maps failed to load — check the API key / billing.');
    document.head.appendChild(s);
}
// Called by the Maps script once it finishes loading

function onMapsReady() {
    mapsReady = true;
    initMainMap();
    initHomePreviewMap();
    attachPlacesAutocomplete();
    if (userLocation) addOrMoveUserMarker();
}

// ---- Home page preview map ----

function initHomePreviewMap() {
    const el = document.getElementById('mapPreview');
    if (!el || !mapsReady) return;
    const oldPins = document.getElementById('mapPins');
    if (oldPins) oldPins.remove();
    homePreviewMap = new google.maps.Map(el, {
        center: userLocation || DEFAULT_CENTER,
        zoom: 11,
        styles: activeMapStyle(),
        disableDefaultUI: true,
        gestureHandling: 'none',
        clickableIcons: false,
    });
    listings.forEach(l => {
        new google.maps.Marker({
            position: { lat: l.lat, lng: l.lng },
            map: homePreviewMap,
            icon: markerIcon(l.category),
            title: l.title,
        });
    });
    if (userLocation) {
        homeUserMarker = new google.maps.Marker({ position: userLocation, map: homePreviewMap, title: 'You are here', zIndex: 9999, icon: userDot() });
    }
}

// ---- Main map (Map page) ----

function initMainMap() {
    const el = document.getElementById('fullMapEl');
    if (!el || mainMap) return;
    el.innerHTML = '';
    el.style.cursor = 'default';
    mainMap = new google.maps.Map(el, {
        center: userLocation || DEFAULT_CENTER,
        zoom: 11,
        styles: activeMapStyle(),
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
    });
    refreshMainMarkers();
}
// (Re)build markers, honoring the active category filter + clustering

function refreshMainMarkers() {
    if (!mapsReady || !mainMap) return;
    if (mainClusterer) mainClusterer.clearMarkers();
    mainMarkers.forEach(m => m.setMap(null));
    mainMarkers = [];
    const list = selectedMapCategories.size > 0
        ? listings.filter(l => selectedMapCategories.has(l.category))
        : listings;
    const info = new google.maps.InfoWindow();
    list.forEach(l => {
        const marker = new google.maps.Marker({
            position: { lat: l.lat, lng: l.lng },
            title: l.title,
            icon: markerIcon(l.category),
        });
        marker.addListener('click', () => {
            info.setContent(
                '<div style="font-family:sans-serif;max-width:200px;color:#1a1714">' +
                '<strong>' + l.title + '</strong><br>' +
                '<span style="color:#5a5550;font-size:12px">' + l.city + ', ' + l.state + '</span><br>' +
                '<a href="#" style="color:#D4AF37" onclick="showDetail(\'' + l.id + '\');return false;">View details →</a>' +
                '</div>'
            );
            info.open(mainMap, marker);
        });
        mainMarkers.push(marker);
    });
    // Cluster if the library loaded in time; otherwise just drop the markers
    if (window.markerClusterer && window.markerClusterer.MarkerClusterer) {
        mainClusterer = new window.markerClusterer.MarkerClusterer({ map: mainMap, markers: mainMarkers });
    } else {
        mainMarkers.forEach(m => m.setMap(mainMap));
    }
}

// ---- Detail page mini-map ----

function initDetailMiniMap(listing) {
    if (!mapsReady) return;
    const el = document.getElementById('detailMiniMap');
    if (!el) return;
    el.innerHTML = '';
    detailMap = new google.maps.Map(el, {
        center: { lat: listing.lat, lng: listing.lng },
        zoom: 14,
        styles: activeMapStyle(),
        disableDefaultUI: true,
        gestureHandling: 'cooperative',
    });
    new google.maps.Marker({
        position: { lat: listing.lat, lng: listing.lng },
        map: detailMap,
        icon: markerIcon(listing.category),
    });
}

// ---- Nearby page map ----

function initNearbyMap() {
    if (!mapsReady) return;
    const el = document.getElementById('nearbyMapEl');
    if (!el) return;
    if (!nearbyMap) {
        el.innerHTML = '';
        nearbyMap = new google.maps.Map(el, {
            center: userLocation || DEFAULT_CENTER,
            zoom: 11,
            styles: activeMapStyle(),
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        });
        listings.forEach(l => {
            const marker = new google.maps.Marker({
                position: { lat: l.lat, lng: l.lng },
                map: nearbyMap,
                title: l.title,
                icon: markerIcon(l.category),
            });
            marker.addListener('click', () => showDetail(l.id));
        });
        if (userLocation) {
            new google.maps.Marker({ position: userLocation, map: nearbyMap, title: 'You are here', icon: userDot() });
        }
    }
    // Maps need a nudge when revealed from a previously hidden container
    google.maps.event.trigger(nearbyMap, 'resize');
    nearbyMap.setCenter(userLocation || DEFAULT_CENTER);
}

// ============================================================
// USER LOCATION & REAL DISTANCES (browser Geolocation — no key needed)
// ============================================================

function distanceMiles(lat1, lng1, lat2, lng2) {
    const toRad = d => d * Math.PI / 180;
    const R = 3958.8; // Earth radius, miles
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// Replace each listing's distance with the real value from the user

function recomputeDistances() {
    if (!userLocation) return;
    listings.forEach(l => {
        l.distance = Math.round(distanceMiles(userLocation.lat, userLocation.lng, l.lat, l.lng) * 10) / 10;
    });
}
// Drop / move the "you are here" marker on the main map

function addOrMoveUserMarker() {
    if (!mapsReady || !mainMap || !userLocation) return;
    if (userMarker) userMarker.setMap(null);
    userMarker = new google.maps.Marker({ position: userLocation, map: mainMap, title: 'You are here', zIndex: 9999, icon: userDot() });
    mainMap.setCenter(userLocation);
}

// ============================================================
// INLINE DELETE CONFIRMATION
// ============================================================

function attachPlacesAutocomplete() {
    if (!mapsReady || !google.maps.places) return;
    const input = document.getElementById('addressInput');
    if (!input || placesAutocomplete) return;
    placesAutocomplete = new google.maps.places.Autocomplete(input, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'geometry'],
    });
    placesAutocomplete.addListener('place_changed', () => {
        const place = placesAutocomplete.getPlace();
        if (!place.geometry) return;
        let streetNumber = '', route = '', city = '', state = '', zip = '';
        (place.address_components || []).forEach(c => {
            if (c.types.includes('street_number')) streetNumber = c.long_name;
            if (c.types.includes('route')) route = c.long_name;
            if (c.types.includes('locality')) city = c.long_name;
            if (c.types.includes('administrative_area_level_1')) state = c.short_name;
            if (c.types.includes('postal_code')) zip = c.long_name;
        });
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
        set('addressInput', (streetNumber + ' ' + route).trim());
        set('cityInput', city);
        set('stateInput', state);
        set('zipInput', zip);
        set('latInput', place.geometry.location.lat());
        set('lngInput', place.geometry.location.lng());
    });
    const dropdown = document.getElementById('autocompleteDropdown');
    if (dropdown) dropdown.style.display = 'none';
    // Hero search bar autocomplete
    const heroInput = document.getElementById('heroSearch');
    if (heroInput && !heroSearchAutocomplete) {
        heroSearchAutocomplete = new google.maps.places.Autocomplete(heroInput, {
            types: ['geocode'],
            componentRestrictions: { country: 'us' },
            fields: ['address_components', 'geometry', 'formatted_address'],
        });
        heroSearchAutocomplete.addListener('place_changed', () => {
            const place = heroSearchAutocomplete.getPlace();
            if (!place.geometry) return;
            let city = '', zip = '';
            (place.address_components || []).forEach(c => {
                if (c.types.includes('locality')) city = c.long_name;
                if (c.types.includes('postal_code')) zip = c.long_name;
            });
            heroInput.value = city || zip || heroInput.value;
            // Re-centre distances around the searched location
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            listings.forEach(l => {
                l.distance = Math.round(distanceMiles(lat, lng, l.lat, l.lng) * 10) / 10;
            });
            applySearch();
        });
    }
}
// Expose functions to window for HTML onclick attributes

// Expose functions to window for HTML onclick attributes
window.onMapsReady = onMapsReady; // Google Maps script callback
