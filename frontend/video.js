/* ══════════════════════════════════════════
   video.js — Video Detection Logic
   ══════════════════════════════════════════ */

const API_URL = 'http://127.0.0.1:8000/detect-video';
let selectedFile = null;
let processedVideoUrl = null;

window.onload = function () {
  const fileInput = document.getElementById('file-input');
  const dropZone  = document.getElementById('drop-zone');
  const btnBrowse = document.getElementById('btn-browse');
  const btnDetect = document.getElementById('btn-detect');
  const btnNext   = document.getElementById('btn-next');

  // Browse button -> open file picker
  btnBrowse.onclick = function (e) {
    e.stopPropagation();
    fileInput.click();
  };

  // Drop zone click -> open file picker
  dropZone.onclick = function (e) {
    if (e.target !== btnBrowse) fileInput.click();
  };

  // File picker change
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
    const f = e.dataTransfer.files[0];
    if (f && f.type.indexOf('video/') === 0) setFile(f);
  };

  // Process video button
  btnDetect.onclick = processVideo;

  // Next video button
  btnNext.onclick = resetAll;
};

function setFile(file) {
  selectedFile = file;

  document.getElementById('file-name').textContent =
    file.name + '  (' + (file.size / (1024 * 1024)).toFixed(2) + ' MB)';

  document.getElementById('file-preview').style.display   = 'flex';
  document.getElementById('btn-detect').style.display     = 'block';
  document.getElementById('result-section').style.display = 'none';
}

function processVideo() {
  if (!selectedFile) return;

  // Show loader, hide other UI elements
  document.getElementById('btn-detect').style.display     = 'none';
  document.getElementById('upload-card').style.display    = 'none';
  document.getElementById('loader').style.display         = 'flex';
  document.getElementById('result-section').style.display = 'none';

  const formData = new FormData();
  formData.append('file', selectedFile);

  const user = getUser();
  if (user && user.email) {
    formData.append('email', user.email);
  }

  fetch(API_URL, {
    method: 'POST',
    body: formData
  })
  .then(function (res) {
    if (!res.ok) throw new Error('Server returned HTTP ' + res.status);
    return res.blob();
  })
  .then(function (blob) {
    showResults(blob);
  })
  .catch(function (err) {
    document.getElementById('loader').style.display         = 'none';
    document.getElementById('upload-card').style.display    = 'block';
    document.getElementById('btn-detect').style.display     = 'block';
    alert(
      '❌ Could not process video\n\n' +
      'Error: ' + err.message + '\n\n' +
      'Make sure your backend FastAPI is running and you uploaded a valid video format.'
    );
  });
}

function showResults(blob) {
  document.getElementById('loader').style.display = 'none';

  // Revoke previous URL if exists to avoid memory leak
  if (processedVideoUrl) {
    URL.revokeObjectURL(processedVideoUrl);
  }

  // Create local URL for the processed video blob
  processedVideoUrl = URL.createObjectURL(blob);

  // Bind to video player and download link
  const videoPlayer = document.getElementById('result-video');
  videoPlayer.src = processedVideoUrl;
  
  const downloadBtn = document.getElementById('download-btn');
  downloadBtn.href = processedVideoUrl;
  downloadBtn.download = 'annotated_' + selectedFile.name;

  // Update verdict metadata text
  document.getElementById('verdict-meta').innerHTML = 
    'PROCESSED FILE: <strong>' + selectedFile.name + '</strong>';

  // Display the result section
  document.getElementById('result-section').style.display = 'flex';
  
  // Auto-play the processed video
  videoPlayer.play().catch(e => console.log("Auto-play blocked by browser. User must click play."));
}

function resetAll() {
  selectedFile = null;
  
  if (processedVideoUrl) {
    URL.revokeObjectURL(processedVideoUrl);
    processedVideoUrl = null;
  }

  document.getElementById('file-input').value              = '';
  document.getElementById('file-name').textContent         = '—';
  
  const videoPlayer = document.getElementById('result-video');
  videoPlayer.src = '';
  videoPlayer.load();

  document.getElementById('file-preview').style.display    = 'none';
  document.getElementById('btn-detect').style.display      = 'none';
  document.getElementById('result-section').style.display  = 'none';
  document.getElementById('loader').style.display          = 'none';
  document.getElementById('upload-card').style.display     = 'block';
  document.getElementById('upload-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
