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
  await initStrudel();
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
      // test pattern: bass, chords, arp, drums, lead
      code = `stack(
  note("<c2 eb2 f2 g2>").s("sawtooth").lpf("<300 600 400 800>").lpq(8).gain(0.7),
  note("c3 [eb3 g3] bb3 [c4 g3]").s("sine").slow(2).delay(0.4).delayfeedback(0.5).gain(0.35),
  note("<g4 bb4 c5 eb5>*3").s("triangle").slow(3).gain(0.2).delay(0.2),
  s("bd ~ [~ bd] ~").gain(0.6),
  s("~ sd ~ [sd ~]").gain(0.5),
  s("hh*8").gain(0.15),
  note("c5 ~ ~ ~ eb5 ~ g5 ~").s("square").lpf(1200).gain(0.12)
).gain(0.55)`;

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
