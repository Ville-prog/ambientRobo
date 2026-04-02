/**
 * app.js
 *
 * Handles prompt submission, Groq API communication, and Strudel pattern evaluation for ambientRobo.
 * Submits user prompts to the backend, evaluates the returned Strudel code, and activates the visualizer.
 *
 * Requires: visualizer.js (startAudioLogging), @strudel/web global (initStrudel, evaluate, strudel).
 *
 * @author Ville Laaksoaho
 */

const form = document.getElementById('prompt-form');
const input = document.getElementById('prompt-input');
const btn = document.getElementById('submit-btn');
const errorEl = document.getElementById('error');

let strudelReady = false;
let history = [];

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
}

function showErrorHTML(html) {
  errorEl.innerHTML = html;
  errorEl.classList.remove('hidden');
}

function clearError() {
  errorEl.classList.add('hidden');
}

/**
 * @brief Initialises the Strudel audio engine on first call; no-ops on subsequent calls.
 */
async function initAudio() {
  if (strudelReady) return;
  await initStrudel({
    prebake: () => fetch('https://ambientrobo-production.up.railway.app/samples-manifest')
      .then(r => r.json())
      .then(manifest => samples(manifest))
  });
  strudelReady = true;
}

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event('submit'));
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const prompt = input.value.trim();
  if (!prompt) return;

  // Initialise Strudel Web Audio engine on first submission
  await initAudio();

  btn.disabled = true;
  btn.textContent = 'generating...';
  clearError();

  // Append the new user message to the running conversation history
  const newHistory = [...history, { role: 'user', content: prompt }];

  try {
    const res = await fetch('https://ambientrobo-production.up.railway.app/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history }),
    });
    if (res.status === 429) throw new Error('rate_limit');
    if (!res.ok) throw new Error('Request failed');
    const data = await res.json();

    // Strip any markdown code fences the model may have wrapped around the code
    const code = stripFences(data.result);

    // Commit the LLM reply to history and clear the input
    history = [...newHistory, { role: 'assistant', content: code }];
    input.value = '';

    // Wrap in .analyze(1) so the Web Audio analyser node is wired into the chain
    const codeWithAnalyser = `(${code}).gain(0.5).analyze(1)`;
    document.getElementById('tuning-panel').classList.remove('hidden');

    try {
      await evaluate(codeWithAnalyser);
    } catch (evalErr) {
      showError('The generated pattern had an error and could not play. Try rephrasing your prompt or reloading the page.');
      return;
    }

    startAudioLogging(); // activates the visualizer (defined in visualizer.js)
    addHistoryEntry(prompt, code);

  } catch (err) {
    console.error('[audio] error:', err);
    if (err.message === 'rate_limit') {
      showErrorHTML('ambientRobo is a small demo and has hit its limit for now. Come back later, or <a href="https://github.com/Ville-prog" target="_blank">reach out to me</a> to explore it further.');
    } else {
      showError('Something went wrong. Is the backend running?');
    }
    
  } finally {
    btn.disabled = false;
    btn.textContent = 'generate';
  }
});

// INFO PANEL
const infoBtn   = document.getElementById('info-btn');
const infoPanel = document.getElementById('info-panel');

infoBtn.addEventListener('click', () => {
  infoPanel.classList.toggle('hidden');
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
  });
});

function addHistoryEntry(prompt, code) {
  const list = document.getElementById('history-list');
  const entry = document.createElement('div');
  entry.className = 'history-entry';
  entry.innerHTML = `
    <div class="history-prompt">${prompt}</div>
    <pre class="history-code">${code}</pre>
  `;
  list.prepend(entry);
}
