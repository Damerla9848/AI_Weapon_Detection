/* ══════════════════════════════════════════
   nav.js — Shared Navigation & Auth Guard
   Include on EVERY page after nav.css
   ══════════════════════════════════════════ */

// ─── AUTH HELPERS ───────────────────────────────────────
function isLoggedIn() {
  return !!sessionStorage.getItem('ws_user');
}
function getUser() {
  try { return JSON.parse(sessionStorage.getItem('ws_user')); }
  catch(e) { return null; }
}
function setUser(data) {
  sessionStorage.setItem('ws_user', JSON.stringify(data));
}
function logout() {
  sessionStorage.removeItem('ws_user');
  showToast('SESSION TERMINATED', 'warn');
  setTimeout(function() { window.location.href = 'auth.html'; }, 1000);
}
// ────────────────────────────────────────────────────────

// ─── TOAST SYSTEM ───────────────────────────────────────
function showToast(msg, type) {
  type = type || 'info'; // info | warn | error | success
  var container = document.getElementById('toast-container');
  if (!container) return;

  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;

  var icons = {
    info:    '◈',
    warn:    '⚠',
    error:   '✕',
    success: '✓'
  };

  toast.innerHTML =
    '<span class="toast-icon">' + (icons[type] || '◈') + '</span>' +
    '<span class="toast-msg">' + msg + '</span>' +
    '<button class="toast-close" onclick="this.parentElement.remove()">✕</button>';

  container.appendChild(toast);

  // animate in
  requestAnimationFrame(function() {
    toast.classList.add('toast-show');
  });

  // auto-remove after 4s
  setTimeout(function() {
    toast.classList.remove('toast-show');
    setTimeout(function() { toast.remove(); }, 400);
  }, 4000);
}
// ────────────────────────────────────────────────────────

// ─── BUILD NAVBAR ────────────────────────────────────────
function buildNav() {
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  var loggedIn    = isLoggedIn();
  var user        = getUser();

  var navHtml =
    '<nav id="ws-nav">' +

      // LEFT: Logo
      '<div class="nav-logo">' +
        '<div class="nav-logo-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
            '<circle cx="11" cy="11" r="7"/>' +
            '<line x1="16.5" y1="16.5" x2="22" y2="22"/>' +
            '<line x1="11" y1="8" x2="11" y2="14"/>' +
            '<line x1="8" y1="11" x2="14" y2="11"/>' +
          '</svg>' +
        '</div>' +
        '<div>' +
          '<span class="nav-logo-title">WeaponScan</span>' +
          '<span class="nav-logo-sub">YOLOV8S · OBJECT DETECTION</span>' +
        '</div>' +
      '</div>' +

      // CENTER: Nav links
      '<div class="nav-links">' +
        '<a href="index.html" class="nav-link' + (currentPage === 'index.html' || currentPage === '' ? ' active' : '') + '" ' +
          'onclick="guardNav(event, \'index.html\')">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<rect x="3" y="3" width="18" height="18" rx="1"/>' +
            '<circle cx="8.5" cy="8.5" r="1.5"/>' +
            '<polyline points="21,15 16,10 5,21"/>' +
          '</svg>' +
          'Detection' +
        '</a>' +
        '<a href="auth.html" class="nav-link' + (currentPage === 'auth.html' ? ' active' : '') + '">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<rect x="3" y="11" width="18" height="11" rx="2"/>' +
            '<path d="M7 11V7a5 5 0 0110 0v4"/>' +
          '</svg>' +
          'Authentication' +
        '</a>' +
        '<a class="nav-link' + (currentPage === 'live.html' ? ' active' : '') + '" href="live.html" onclick="guardNav(event, \'live.html\')">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M23 7l-7 5 7 5V7z"/>' +
            '<rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>' +
          '</svg>' +
          'Live' +
        '</a>' +
        '<a class="nav-link' + (currentPage === 'video.html' ? ' active' : '') + '" href="video.html" onclick="guardNav(event, \'video.html\')">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<circle cx="12" cy="12" r="10"/>' +
            '<polygon points="10 8 16 12 10 16 10 8"/>' +
          '</svg>' +
          'Video' +
        '</a>' +
      '</div>' +

      // RIGHT: Auth state
      '<div class="nav-right">' +
        (loggedIn
          ? // ── LOGGED IN ──
            '<div class="nav-user">' +
              '<div class="nav-avatar">' + (user && user.name ? user.name[0].toUpperCase() : 'O') + '</div>' +
              '<div class="nav-user-info">' +
                '<span class="nav-user-name">' + (user && user.name ? user.name.toUpperCase() : 'OPERATOR') + '</span>' +
                '<span class="nav-user-role">AUTHENTICATED</span>' +
              '</div>' +
            '</div>' +
            '<div class="nav-divider"></div>' +
            '<div class="status-pill">' +
              '<div class="dot"></div>' +
              'MODEL READY' +
            '</div>' +
            '<button class="nav-logout-btn" onclick="logout()" title="Sign Out">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>' +
                '<polyline points="16,17 21,12 16,7"/>' +
                '<line x1="21" y1="12" x2="9" y2="12"/>' +
              '</svg>' +
              'Sign Out' +
            '</button>'
          : // ── NOT LOGGED IN ──
            '<div class="status-pill status-locked">' +
              '<div class="dot dot-warn"></div>' +
              'NOT AUTHENTICATED' +
            '</div>' +
            '<a href="auth.html" class="nav-login-btn">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>' +
                '<polyline points="10,17 15,12 10,7"/>' +
                '<line x1="15" y1="12" x2="3" y2="12"/>' +
              '</svg>' +
              'Sign In' +
            '</a>'
        ) +
      '</div>' +

    '</nav>' +

    // Toast container
    '<div id="toast-container"></div>';

  // Inject at top of body
  var wrapper = document.createElement('div');
  wrapper.innerHTML = navHtml;
  document.body.insertBefore(wrapper.firstChild, document.body.firstChild);
  document.body.insertBefore(wrapper.firstChild, document.body.firstChild); // toast container
}

// ─── GUARD: protect Detection page ──────────────────────
function guardNav(e, page) {
  if (!isLoggedIn()) {
    e.preventDefault();
    showToast('⚠  YOU MUST SIGN IN TO ACCESS DETECTION', 'warn');
    // shake the sign-in button
    var btn = document.querySelector('.nav-login-btn');
    if (btn) {
      btn.classList.add('shake');
      setTimeout(function() { btn.classList.remove('shake'); }, 600);
    }
    setTimeout(function() { window.location.href = 'auth.html'; }, 1600);
  }
}

// ─── GUARD: block index.html if not logged in ────────────
function pageGuard() {
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if ((currentPage === 'index.html' || currentPage === '' || currentPage === 'live.html' || currentPage === 'video.html') && !isLoggedIn()) {
    showToast('⚠  AUTHENTICATION REQUIRED — REDIRECTING TO LOGIN', 'error');
    setTimeout(function() { window.location.href = 'auth.html'; }, 1800);
  }
}

// ─── INIT ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function() {
  buildNav();
  pageGuard();
});