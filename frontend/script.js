/* ══════════════════════════════════════════
   script.js — Weapon Detection Logic
   ══════════════════════════════════════════ */

// ─── CONFIG ─────────────────────────────────────────────
// Change this IP/port to match where FastAPI is running
var API_URL = 'http://127.0.0.1:8000/upload';
// ────────────────────────────────────────────────────────

// http://192.168.1.4:5500/frontend/index.html

var selectedFile = null;

// ════════════════════════════════════════════
// WIRE ALL EVENTS once page is fully loaded
// ════════════════════════════════════════════
window.onload = function () {

  var fileInput = document.getElementById('file-input');
  var dropZone  = document.getElementById('drop-zone');
  var btnBrowse = document.getElementById('btn-browse');
  var btnDetect = document.getElementById('btn-detect');
  var btnNext   = document.getElementById('btn-next');

  // Browse button → open file picker
  btnBrowse.onclick = function (e) {
    e.stopPropagation();
    fileInput.click();
  };

  // Drop zone click → open file picker
  dropZone.onclick = function (e) {
    // Don't trigger if user clicked the Browse button itself
    if (e.target !== btnBrowse) fileInput.click();
  };

  // File chosen via picker
  fileInput.onchange = function () {
    if (fileInput.files && fileInput.files.length > 0) {
      setFile(fileInput.files[0]);
    }
  };

  // Drag & drop
  dropZone.ondragover = function (e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
  };
  dropZone.ondragleave = function () {
    dropZone.classList.remove('dragover');
  };
  dropZone.ondrop = function (e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    var f = e.dataTransfer.files[0];
    if (f && f.type.indexOf('image/') === 0) setFile(f);
  };

  // Run Detection button
  btnDetect.onclick = runDetection;

  // Next Image button
  btnNext.onclick = resetAll;

};

// ════════════════════════════════════════════
// SET FILE — called when user picks an image
// ════════════════════════════════════════════
function setFile(file) {
  selectedFile = file;

  document.getElementById('file-name').textContent =
    file.name + '  (' + (file.size / 1024).toFixed(1) + ' KB)';

  document.getElementById('file-preview').style.display   = 'flex';
  document.getElementById('btn-detect').style.display     = 'inline-block';
  document.getElementById('result-section').style.display = 'none';
}

// ════════════════════════════════════════════
// RUN DETECTION — POST to FastAPI
// ════════════════════════════════════════════
function runDetection() {
  if (!selectedFile) return;

  // Show loader, hide other elements
  document.getElementById('btn-detect').style.display     = 'none';
  document.getElementById('loader').style.display         = 'flex';
  document.getElementById('result-section').style.display = 'none';

  // ✅ Field must be "file" to match: file: UploadFile = File(...)
  var formData = new FormData();
  formData.append('file', selectedFile);

  fetch(API_URL, { method: 'POST', body: formData })
    .then(function (res) {
      if (!res.ok) throw new Error('Server returned HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      showResults(data);
    })
    .catch(function (err) {
      document.getElementById('loader').style.display     = 'none';
      document.getElementById('btn-detect').style.display = 'inline-block';
      alert(
        '❌ Could not reach backend\n\n' +
        'Error: ' + err.message + '\n\n' +
        'Make sure FastAPI is running:\n' +
        'uvicorn main:app --host 0.0.0.0 --port 8000 --reload\n\n' +
        'Expected URL: ' + API_URL
      );
    });
}

// ════════════════════════════════════════════
// SHOW RESULTS
// ════════════════════════════════════════════
function showResults(data) {

  document.getElementById('loader').style.display = 'none';

  var detections = data.detections || [];
  var isThreat   = (data.threat !== undefined)
                    ? data.threat
                    : detections.length > 0;

  var resultB64 = data.image || null;

  // ---------- Result image ----------
  var img = document.getElementById('result-img');

  if(resultB64){
    img.src='data:image/jpeg;base64,'+resultB64;
    document.getElementById('download-btn').href=
       'data:image/jpeg;base64,'+resultB64;
  }
  else{
    var url=URL.createObjectURL(selectedFile);
    img.src=url;
    document.getElementById('download-btn').href=url;
  }

  // ---------- Verdict ----------
  var banner=document.getElementById('verdict-banner');
  var label=document.getElementById('verdict-label');
  var meta=document.getElementById('verdict-meta');

  if(isThreat){
     banner.className='verdict-banner threat';
     label.textContent='⚠ THREAT DETECTED';
     playBeep('threat');
  }
  else{
     banner.className='verdict-banner safe';
     label.textContent='✓ ALL CLEAR';
     playBeep('clear');
  }

  meta.innerHTML=
    'OBJECTS FOUND: <strong>'+detections.length+
    '</strong><br>FILE: <strong>'+
    selectedFile.name+
    '</strong>';



  // ---------- Detection list ----------
  var list=document.getElementById('detections-list');

  if(detections.length===0){

      list.innerHTML=
      '<div class="no-det">NO WEAPONS FOUND</div>';

  }
  else{

      list.innerHTML='';

      detections.forEach(function(d,i){

          var conf=Math.round(
             (d.confidence||0)*100
          );

          var rawLabel=d["class"] || "Object";

          var card=document.createElement('div');

          card.className='det-item';

          card.innerHTML=
           '<div class="det-row">'+
           '<div class="det-name">'+rawLabel+'</div>'+
           '<div class="det-conf">'+conf+'%</div>'+
           '</div>';

          list.appendChild(card);

      });

  }



  // =====================================
  // SEND EMAIL ALERT TO LOGGED-IN USER
  // =====================================
  const user =
     JSON.parse(
       sessionStorage.getItem('ws_user')
     );

  if(user && user.email && isThreat){

      fetch(
        'http://127.0.0.1:8000/send-alert',
        {
          method:'POST',

          headers:{
             'Content-Type':'application/json'
          },

          body: JSON.stringify({
            email:user.email,
            threat:isThreat,
            detections:detections,
            image: resultB64
          })

        }
      )
      .then(r=>r.json())
      .then(x=>console.log(
          "Alert sent:",x
      ))
      .catch(err=>console.error(
          "Alert error:",err
      ));

  }


  // ---------- Show results ----------
  document.getElementById(
    'result-section'
  ).style.display='flex';


  // Scan animation
  var scan=document.getElementById(
     'scan-anim'
  );

  scan.classList.add('running');

  setTimeout(function(){

     scan.classList.remove(
       'running'
     );

  },3000);

}

// ════════════════════════════════════════════
// RESET — Next Image button
// ════════════════════════════════════════════
function resetAll() {
  selectedFile = null;
  document.getElementById('file-input').value              = '';
  document.getElementById('file-name').textContent         = '—';
  document.getElementById('file-preview').style.display    = 'none';
  document.getElementById('btn-detect').style.display      = 'none';
  document.getElementById('result-section').style.display  = 'none';
  document.getElementById('loader').style.display          = 'none';
  document.getElementById('detections-list').innerHTML     = '<div class="no-det">No data yet</div>';
  document.getElementById('result-img').src                = '';
  document.getElementById('upload-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ════════════════════════════════════════════
// BEEP SOUND (Web Audio API — no files needed)
// ════════════════════════════════════════════
function playBeep(type) {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var cfg = type === 'threat'
      ? [{freq:880,t:0.00,dur:0.18},{freq:660,t:0.22,dur:0.18},{freq:880,t:0.44,dur:0.30}]
      : [{freq:523,t:0.00,dur:0.12},{freq:659,t:0.15,dur:0.25}];

    cfg.forEach(function (c) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type            = type === 'threat' ? 'square' : 'sine';
      o.frequency.value = c.freq;
      g.gain.setValueAtTime(type === 'threat' ? 0.4 : 0.25, ctx.currentTime + c.t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + c.t + c.dur);
      o.start(ctx.currentTime + c.t);
      o.stop(ctx.currentTime + c.t + c.dur + 0.05);
    });
  } catch (e) { /* audio blocked by browser */ }
}
