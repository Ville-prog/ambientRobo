/**
 * visualizer.js
 *
 * Audio-reactive flow field visualizer for ambientRobo. Reads frequency and
 * amplitude data from the Strudel Web Audio analyser and renders a dynamic
 * canvas animation driven entirely by the audio signal.
 *
 * Requires: strudel (global, loaded via unpkg @strudel/web), index.html canvas#viz and #tuning-panel.
 *
 * @author Ville Laaksoaho
 */

const canvas = document.getElementById('viz');
const ctx = canvas.getContext('2d');

let flowField;

/**
 * @brief Resizes the canvas to fill the viewport and notifies the flow field.
 */
function resize() {

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.lineCap = 'round';

  if (flowField) flowField.resize(canvas.width, canvas.height);
}

window.addEventListener('resize', resize);
resize();

// TUNING PARAMS
let MAX_ALPHA = 0.21;
let MAX_WIDTH = 0.0;
let SPEED = 0.0005;

// Slider sets the ceiling; oscillator drifts each param between its floor and that ceiling.
const ALPHA_FLOOR = 0.01;
const WIDTH_FLOOR = 0.05;
const SPEED_FLOOR = 0.0001;

let phase = 0;
let currentAlphaMult = ALPHA_FLOOR;
let currentWidthMult = WIDTH_FLOOR;
let currentSpeed     = SPEED_FLOOR;

/**
 * @brief Advances the oscillator phase and updates all current rendering params.
 *
 * Blends two incommensurable sine waves for organic, non-repeating drift.
 * Each param sweeps between its floor constant and its slider max.
 */
function tickOscillator() {
  phase += 0.00004;
  const t = ((Math.sin(phase) + Math.sin(phase * 0.37 + 1.3)) / 2 + 1) / 2;
  currentAlphaMult = ALPHA_FLOOR + t * (MAX_ALPHA - ALPHA_FLOOR);
  currentWidthMult = WIDTH_FLOOR + t * (MAX_WIDTH - WIDTH_FLOOR);
  currentSpeed     = SPEED_FLOOR + t * (SPEED     - SPEED_FLOOR);
}

// AUDIO HELPERS

/**
 * @brief Computes the root mean square of a float audio buffer.
 *
 * @param {Float32Array} buf Time-domain audio samples in the range [-1, 1].
 * @returns {number} RMS amplitude value in the range [0, 1].
 */
function getRMS(buf) {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

/**
 * @brief Reads frequency bin data from an AnalyserNode and returns normalised band energies.
 *
 * @param {AnalyserNode} node Web Audio AnalyserNode to read from.
 * @returns {{ low: number, mid: number, high: number }} Normalised energy (0–1) for bass, mid, and treble bands.
 */
function getFrequencyData(node) {

  const freqBuf = new Uint8Array(node.frequencyBinCount);
  node.getByteFrequencyData(freqBuf);
  let low = 0, mid = 0, high = 0;
  const len = freqBuf.length;

  for (let i = 0; i < len; i++) {
    const v = freqBuf[i] / 255;

    if (i < len * 0.1) low += v;
    else if (i < len * 0.4) mid += v;
    else high += v;
  }
  return { low: low / (len * 0.1), mid: mid / (len * 0.3), high: high / (len * 0.6) };
}

// FLOW FIELD VISUALIZER (based on FranksLaboratory https://codepen.io/franksLaboratory/pen/BaZJoxR)

class FlowFieldEffect {
  #ctx;
  #width;
  #height;
  #radius;
  #radiusHigh;
  #time;

  constructor(ctx, width, height) {
    this.#ctx = ctx;
    this.#width = width;
    this.#height = height;
    this.#radius = 0;
    this.#radiusHigh = 0;
    this.#time = 0;
    this.cellSize = 7;
  }

  resize(width, height) {
    this.#width = width;
    this.#height = height;
  }

  /**
   * @brief Draws one frame of the flow field, modulated by the current audio state.
   *
   * @param {number} amp Overall RMS amplitude in the range [0, 1].
   * @param {{ low: number, mid: number, high: number }} bands Normalised bass, mid, and treble energies.
   */
  render(amp, bands) {
    this.#time += currentSpeed + amp * currentSpeed * 30 + bands.low * currentSpeed * 15;

    const target = bands.low * 14 + bands.mid * 7 + bands.high * 2;
    this.#radius += (target - this.#radius) * 0.22;

    const targetHigh = bands.high * 5 + bands.mid * 3;
    this.#radiusHigh += (targetHigh - this.#radiusHigh) * 0.28;

    this.#ctx.strokeStyle = `rgba(255,255,255,${0.02 + amp * currentAlphaMult})`;
    this.#ctx.lineWidth = 0.2 + amp * currentWidthMult;

    const lineLength = 10 + amp * 120;
    const cosT1 = Math.cos(this.#time);
    const cosT2 = Math.cos(this.#time * 0.7);
    const sinT3 = Math.sin(this.#time * 1.4);

    this.#ctx.beginPath();
    for (let y = 0; y < this.#height; y += this.cellSize) {
      for (let x = 0; x < this.#width; x += this.cellSize) {

        const angle = this.#getValue(x, y, cosT1, cosT2, sinT3);
        this.#ctx.moveTo(x, y);
        this.#ctx.lineTo(x + Math.cos(angle) * lineLength, y + Math.sin(angle) * lineLength);
      }
    }
    this.#ctx.stroke();
  }

  /**
   * @brief Computes the flow angle for a given grid cell using two interfering wave layers.
   *
   * @param {number} x Cell x position in pixels.
   * @param {number} y Cell y position in pixels.
   * @param {number} t1 Precomputed cos(time) for the primary wave.
   * @param {number} t2 Precomputed cos(time * 0.7) for the primary wave y-axis.
   * @param {number} t3 Precomputed sin(time * 1.4) for the secondary interference layer.
   * @returns {number} Flow angle in radians.
   */
  #getValue(x, y, t1, t2, t3) {
    const a = (Math.cos(x * 0.005 + t1) + Math.sin(y * 0.005 + t2)) * this.#radius;
    const b = Math.sin((x + y) * 0.004 + t3) * this.#radiusHigh;
    return (a + b) * Math.PI;
  }
}

flowField = new FlowFieldEffect(ctx, canvas.width, canvas.height);

// MAIN LOOP

let active = false;
let vizOn  = true;

/**
 * @brief Main animation loop. Reads audio data each frame and delegates rendering to the flow field.
 */
function draw() {
  requestAnimationFrame(draw);
  if (!active) return;

  tickOscillator();

  if (!vizOn) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const node = strudel.analyser;
  if (!node) {
    flowField.render(0, { low: 0, mid: 0, high: 0 });
    return;
  }

  node.smoothingTimeConstant = 0.92;

  const timeBuf = new Float32Array(node.frequencyBinCount);
  node.getFloatTimeDomainData(timeBuf);

  flowField.render(getRMS(timeBuf), getFrequencyData(node));
}

draw();

function startAudioLogging() {
  active = true;
}

// TUNING PANEL

const sliderRows = document.querySelectorAll('#tuning-panel .tuning-row');

sliderRows.forEach(row => row.style.display = 'none');

document.getElementById('viz-toggle').addEventListener('change', (e) => {
  vizOn = e.target.checked;
});

document.getElementById('tune-toggle').addEventListener('change', (e) => {
  sliderRows.forEach(row => row.style.display = e.target.checked ? 'flex' : 'none');
});

/**
 * @brief Wires a range input to a live numeric display and a setter callback.
 *
 * @param {string} id Element ID of the range input.
 * @param {string} valId Element ID of the display span.
 * @param {number} decimals Number of decimal places for the display value.
 * @param {function(number): void} onValue Callback invoked with the parsed value on each input event.
 */
function bindSlider(id, valId, decimals, onValue) {
  document.getElementById(id).addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    document.getElementById(valId).textContent = v.toFixed(decimals);
    onValue(v);
  });
}

// Initialise slider positions and labels from the JS constants
function initSlider(id, valId, value, decimals) {
  document.getElementById(id).value = value;
  document.getElementById(valId).textContent = value.toFixed(decimals);
}

initSlider('alpha-slider', 'alpha-val', MAX_ALPHA, 2);
initSlider('width-slider', 'width-val', MAX_WIDTH, 1);
initSlider('speed-slider', 'speed-val', SPEED,     4);

bindSlider('alpha-slider', 'alpha-val', 2,  v => MAX_ALPHA = v);
bindSlider('width-slider', 'width-val', 1,  v => MAX_WIDTH = v);
bindSlider('speed-slider', 'speed-val', 4,  v => SPEED     = v);