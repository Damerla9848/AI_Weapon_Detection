/* ══════════════════════════════════════════
   auth.script.js — WeaponScan Auth Logic
   ══════════════════════════════════════════ */

// ─── CONFIG ─────────────────────────────────────────────
// Change this to match your FastAPI backend URL
var API_BASE = 'http://127.0.0.1:8000';
// ────────────────────────────────────────────────────────

/* ══ TAB SWITCH ══ */
function switchTab(tab) {
  document.getElementById('panel-login').classList.toggle('active', tab === 'login');
  document.getElementById('panel-register').classList.toggle('active', tab === 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  hideAlert();
}

/* ══ TOGGLE PASSWORD VISIBILITY ══ */
function togglePass(id, btn) {
  var inp  = document.getElementById(id);
  var show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.innerHTML = show
    ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
    : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}

/* ══ PASSWORD STRENGTH ══ */
function checkStrength(val) {
  var segs   = ['seg1','seg2','seg3','seg4'];
  var lbl    = document.getElementById('strength-label');
  var score  = 0;

  if (val.length >= 8)          score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  var cls    = score <= 1 ? 'weak' : score <= 2 ? 'medium' : 'strong';
  var labels = ['', 'Weak', 'Weak', 'Medium', 'Strong'];
  var colors = ['', 'var(--danger)', 'var(--danger)', 'var(--warn)', 'var(--safe)'];

  segs.forEach(function(segId, i) {
    var el = document.getElementById(segId);
    el.className = 'strength-seg';
    if (val.length > 0 && i < score) el.classList.add(cls);
  });

  lbl.textContent  = val.length === 0 ? 'Enter password' : labels[score];
  lbl.style.color  = val.length === 0 ? 'var(--muted)'   : colors[score];
}

/* ══ ALERT ══ */
function showAlert(msg, type) {
  var box = document.getElementById('alert-box');
  box.textContent = msg;
  box.className = 'alert ' + type + ' show';
}
function hideAlert() {
  document.getElementById('alert-box').className = 'alert';
}

/* ══ LOADING STATE ══ */
function setLoading(on) {
  document.getElementById('auth-card').classList.toggle('loading', on);
}

/* ══ LOGIN HANDLER ══ */
function handleLogin() {

  var email = document.getElementById('login-email').value.trim();
  var pass  = document.getElementById('login-pass').value;

  var users = JSON.parse(localStorage.getItem('registered_users') || '[]');

  var user = users.find(
      u => u.email === email && u.password === pass
  );

  if (!user) {
      showAlert('INVALID EMAIL OR PASSWORD', 'error');
      return;
  }

  // success
  setUser({
      name: user.name,
      email: user.email
  });

  showAlert('LOGIN SUCCESS', 'success');

  setTimeout(function(){
      window.location.href='index.html';
  },1000);
}

/* ══ REGISTER HANDLER ══ */
function handleRegister() {
  if(!emailVerified){
    showAlert('VERIFY EMAIL FIRST','error');
    return;
  }
  var name = document.getElementById('reg-name').value.trim();
  var email = document.getElementById('reg-email').value.trim();
  var pass = document.getElementById('reg-pass').value;
  var confirm = document.getElementById('reg-confirm').value;

  if (!name || !email || !pass || !confirm) {
    showAlert('ALL FIELDS REQUIRED', 'error');
    return;
  }

  if (pass !== confirm) {
    showAlert('PASSWORDS DO NOT MATCH', 'error');
    return;
  }

  // get existing registered users
  var users = JSON.parse(localStorage.getItem('registered_users') || '[]');

  // prevent duplicate email
  if (users.find(u => u.email === email)) {
    showAlert('EMAIL ALREADY REGISTERED', 'error');
    return;
  }

  // save new user
  users.push({
    name: name,
    email: email,
    password: pass
  });

  localStorage.setItem('registered_users', JSON.stringify(users));

  showAlert('ACCOUNT CREATED — NOW SIGN IN', 'success');

  setTimeout(function(){
    switchTab('login');
  },1500);
}

/* ══ FORGOT PASSWORD ══ */
function showForgot(e) {
  e.preventDefault();
  var email = document.getElementById('login-email').value.trim();
  if (!email) {
    showAlert('⚠  ENTER YOUR EMAIL FIRST, THEN CLICK FORGOT', 'error');
    return;
  }
  setLoading(true);

  // Replace with: fetch(API_BASE + '/forgot-password', { ... })
  setTimeout(function() {
    setLoading(false);
    showAlert('✓  RESET LINK SENT TO: ' + email.toUpperCase(), 'success');
  }, 1200);
}

/* ══ OAUTH PLACEHOLDER ══ */
function oauthMsg() {
  showAlert('⚠  OAUTH NOT CONFIGURED IN THIS BUILD', 'error');
}

/* ══ HELPER ══ */
function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/* ══ ENTER KEY SUPPORT ══ */
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  if (document.getElementById('panel-login').classList.contains('active')) {
    handleLogin();
  } else {
    handleRegister();
  }
});

var emailVerified = false;

function sendOtp() {
  let email = document.getElementById('reg-email').value.trim();
  if (!email) {
    showAlert('ENTER YOUR EMAIL FIRST', 'error');
    return;
  }
  if (!isValidEmail(email)) {
    showAlert('INVALID EMAIL ADDRESS', 'error');
    return;
  }

  setLoading(true);
  fetch('http://127.0.0.1:8000/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email })
  })
  .then(r => {
    setLoading(false);
    if (!r.ok) throw new Error("Failed to send OTP");
    return r.json();
  })
  .then(data => {
    showAlert('OTP SENT TO EMAIL', 'success');
    document.getElementById('otp-container').style.display = 'block';
  })
  .catch(err => {
    setLoading(false);
    showAlert('COULD NOT SEND OTP. TRY AGAIN.', 'error');
  });
}

function verifyOtp() {
  let email = document.getElementById('reg-email').value.trim();
  let otp = document.getElementById('otp-input').value.trim();

  if (!otp) {
     showAlert('ENTER OTP CODE', 'error');
     return;
  }

  setLoading(true);
  fetch('http://127.0.0.1:8000/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
       email: email,
       otp: otp
    })
  })
  .then(r => {
    setLoading(false);
    if (!r.ok) throw new Error("Verification failed");
    return r.json();
  })
  .then(data => {
    if (data.verified) {
       emailVerified = true;
       showAlert('EMAIL VERIFIED', 'success');
       document.getElementById('otp-container').style.display = 'none';
       document.getElementById('reg-email').disabled = true;
       document.getElementById('btn-send-otp').style.display = 'none';
       document.getElementById('email-success-indicator').style.display = 'flex';
    } else {
       showAlert('INVALID OTP', 'error');
    }
  })
  .catch(err => {
    setLoading(false);
    showAlert('OTP VERIFICATION ERROR', 'error');
  });
}