const form = document.getElementById('prompt-form');
const input = document.getElementById('prompt-input');
const btn = document.getElementById('submit-btn');
const errorEl = document.getElementById('error');
const statusEl = document.getElementById('status');

let strudelReady = false;
let history = [];

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
}

function clearError() {
  errorEl.classList.add('hidden');
}

function showStatus(msg) {
  statusEl.textContent = msg;
  statusEl.classList.remove('hidden');
}

function clearStatus() {
  statusEl.classList.add('hidden');
}

async function initAudio() {
  if (strudelReady) return;
  initStrudel();
  strudelReady = true;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const prompt = input.value.trim();
  if (!prompt) return;

  await initAudio();

  btn.disabled = true;
  btn.textContent = 'generating...';
  clearError();
  showStatus('generating...');

  const newHistory = [...history, { role: 'user', content: prompt }];

  try {
    const res = await fetch('http://localhost:8000/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history }),
    });

    if (!res.ok) throw new Error('Request failed');

    const data = await res.json();
    history = [...newHistory, { role: 'assistant', content: data.result }];
    input.value = '';

    evaluate(data.result);
    showStatus('playing');
  } catch {
    showError('Something went wrong. Is the backend running?');
    clearStatus();
  } finally {
    btn.disabled = false;
    btn.textContent = 'generate';
  }
});
