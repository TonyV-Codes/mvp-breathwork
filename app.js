// Global variables
let sessionCount = 0;
let timerInterval;
let timerSeconds = 0;
let elapsedSeconds = 0;
let isPaused = false;
let sessionStartTime;

// global functions 
function vibrate(pattern = 200, type = "start") {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  } else {
    // iOS Safari fallback: different beeps for start/end
    if (type === "start") {
      playBeep(880, 200); // high pitch, short
    } else if (type === "end") {
      playBeep(440, 600); // low pitch, longer
    }
    flashScreen();
  }
}

function playBeep(frequency = 440, duration = 300) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine"; 
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      ctx.close();
    }, duration);
  } catch (err) {
    console.log("Beep not supported:", err);
  }
}

function flashScreen() {
  const originalColor = document.body.style.backgroundColor;
  document.body.style.backgroundColor = "yellow";
  setTimeout(() => {
    document.body.style.backgroundColor = originalColor;
  }, 300);
}

// Elements
const startSection = document.getElementById('start-section');
const timerSection = document.getElementById('timer-section');
const surveySection = document.getElementById('survey-section');
const timerDisplay = document.getElementById('timerDisplay');
const logTableBody = document.querySelector('#logTable tbody');

// Start session button
document.getElementById('startSession').addEventListener('click', () => {
  const today = new Date().toISOString().split('T')[0];
  let logs = JSON.parse(localStorage.getItem('breathLogs') || '[]');
  // Count sessions for today only
  sessionCount = logs.filter(l => l.date === today).length + 1;

  startSection.classList.add('hidden');
  timerSection.classList.remove('hidden');
  timerDisplay.textContent = "00:00";
  elapsedSeconds = 0;
  isPaused = false;
  sessionStartTime = Date.now();
});

// Timer functions
function updateTimer() {
  if (!isPaused) {
    if (timerSeconds > 0) {
      timerSeconds--;
      elapsedSeconds++;
      displayTime(timerSeconds);
    } else if (timerSeconds === 0 && presetMode !== 'stopwatch') {
      clearInterval(timerInterval);
      vibrate([300, 100, 300]); // vibrate, pause, vibrate to signal timer finish

      endSession();
    }
  }
}

function displayTime(seconds) {
  const m = Math.floor(seconds/60).toString().padStart(2,'0');
  const s = (seconds%60).toString().padStart(2,'0');
  timerDisplay.textContent = `${m}:${s}`;
}

let presetMode = 'countdown';

document.getElementById('startTimer').addEventListener('click', () => {
  const preset = document.getElementById('preset').value;
  const custom = parseInt(document.getElementById('customDuration').value);

  if (!isNaN(custom) && custom > 0) {
    // Use custom duration if valid
    presetMode = 'countdown';
    timerSeconds = custom;
  } else if (preset === 'stopwatch') {
    presetMode = 'stopwatch';
    timerSeconds = 0;
  } else {
    presetMode = 'countdown';
    timerSeconds = parseInt(preset);
  }

  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
  vibrate(200, "start"); // short vibration/beep
});


document.getElementById('pauseTimer').addEventListener('click', () => {
  isPaused = !isPaused;
});

document.getElementById('stopTimer').addEventListener('click', () => {
  clearInterval(timerInterval);
  if (presetMode === 'stopwatch') {
    elapsedSeconds = Math.floor((Date.now() - sessionStartTime)/1000);
  }
  endSession();
});

// End session → show survey
function endSession() {
  timerSection.classList.add('hidden');
  surveySection.classList.remove('hidden');
  document.getElementById('concentration').value = '';
  document.getElementById('diaphragm').value = '';
  document.getElementById('notes').value = '';
}

// Submit survey
document.getElementById('submitSurvey').addEventListener('click', () => {
  const today = new Date().toISOString().split('T')[0];
  const concentration = document.getElementById('concentration').value;
  const diaphragm = document.getElementById('diaphragm').value;
  const notes = document.getElementById('notes').value;
  const duration = presetMode === 'stopwatch' ? elapsedSeconds : parseInt(document.getElementById('preset').value);

  let logs = JSON.parse(localStorage.getItem('breathLogs') || '[]');
  logs.push({date: today, session: sessionCount, concentration, diaphragm, notes, duration});
  localStorage.setItem('breathLogs', JSON.stringify(logs));

  addLogRow({date: today, session: sessionCount, concentration, diaphragm, notes, duration});

  // Reset for next session
  surveySection.classList.add('hidden');
  startSection.classList.remove('hidden');
});

// Add log row
function addLogRow(log) {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${log.date}</td>
                  <td>${log.session}</td>
                  <td>${log.concentration}</td>
                  <td>${log.diaphragm}</td>
                  <td>${log.notes}</td>
                  <td>${log.duration}</td>
                  <td><button class="delete-btn">Delete</button></td>`;
  logTableBody.appendChild(tr);

  tr.querySelector('.delete-btn').addEventListener('click', () => {
    deleteLog(log);
    tr.remove();
  });
}

// Delete log
function deleteLog(log) {
  let logs = JSON.parse(localStorage.getItem('breathLogs') || '[]');
  logs = logs.filter(l => !(l.date === log.date && l.session === log.session && l.duration === log.duration));
  localStorage.setItem('breathLogs', JSON.stringify(logs));
}

// Load saved logs
function loadLogs() {
  let logs = JSON.parse(localStorage.getItem('breathLogs') || '[]');
  logs.forEach(addLogRow);
}

loadLogs();
