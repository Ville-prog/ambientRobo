/**
 * app.js
 *
 * Handles prompt submission, Groq API communication, and Strudel pattern evaluation for ambientRobo.
 * Submits user prompts to the backend (or a mock pattern), evaluates the returned Strudel code,
 * and activates the visualizer.
 *
 * Requires: visualizer.js (startAudioLogging), @strudel/web global (initStrudel, evaluate, strudel).
 *
 * @author Ville Laaksoaho
 */

const MOCK = true; // set to true to skip Groq API and use a test pattern

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

function clearError() {
  errorEl.classList.add('hidden');
}

/**
 * @brief Initialises the Strudel audio engine on first call; no-ops on subsequent calls.
 */
async function initAudio() {
  if (strudelReady) return;
  await initStrudel({
    prebake: () => fetch('http://localhost:8000/samples-manifest')
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
    let code;

    if (MOCK) {
      // test pattern: ambient techno using custom samples
      code = `stack(
  s("bd*4").n("<0 2 1 0>").gain(0.9),
  s("~ sd ~ sd").n("<0 3>").gain(0.65),
  s("hh*8").n("<0 4 2 6>").gain(0.22).pan("<-0.4 0.4>"),
  s("oh(3,8)").n(0).gain(0.3).room(0.5),
  s("perc(3,8)").n("<0 2 4>").gain(0.28).room(0.6).pan("<-0.6 0.6>"),
  s("shaker*2").n(0).gain(0.18).pan(0.3),
  note("<d1 ~ f1 ~ a1 ~ c2 ~>").s("moog").lpf("<280 400 320>").gain(0.75).slow(2),
  note("d3 ~ f3 ~ a3 ~ c4 ~").s("sine").attack(2).release(3).room(0.85).gain(0.22),
  s("vocalChops").n("<0 2 6 8>").slow(4).room(0.9).gain(0.18).pan("<-0.3 0.3>")
).gain(0.5)`;

    } else {
      // Fetch generated Strudel code from the backend
      const res = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();

      // Strip any markdown code fences the model may have wrapped around the code
      code = data.result.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
    }

    // Commit the LLM reply to history and clear the input
    history = [...newHistory, { role: 'assistant', content: code }];
    input.value = '';

    // Wrap in .analyze(1) so the Web Audio analyser node is wired into the chain
    const codeWithAnalyser = `(${code}).analyze(1)`;
    console.log('[audio] calling evaluate with:', codeWithAnalyser);
    document.getElementById('tuning-panel').classList.remove('hidden');
    evaluate(codeWithAnalyser);
    console.log('[audio] evaluate done. strudel keys:', Object.keys(strudel));

    startAudioLogging(); // activates the visualizer (defined in visualizer.js)

  } catch (err) {
    console.error('[audio] error:', err);
    showError('Something went wrong. Is the backend running?');
    
  } finally {
    btn.disabled = false;
    btn.textContent = 'generate';
  }
});
