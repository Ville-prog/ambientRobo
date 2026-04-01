/**
 * utils.js
 *
 * Pure utility functions shared between app.js and visualizer.js.
 * Also exported via CommonJS for Node/Jest testing.
 * 
 * @author Ville Laaksoaho
 */

/**
 * @brief Computes the root mean square of a float audio buffer.
 *
 * @param {Float32Array|number[]} buf Audio samples.
 * @returns {number} RMS amplitude value.
 */
function getRMS(buf) {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

/**
 * @brief Strips markdown code fences from a string and trims surrounding whitespace.
 *
 * @param {string} code Raw string potentially wrapped in code fences.
 * @returns {string} Clean code string.
 */
function stripFences(code) {
  return code.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
}

if (typeof module !== 'undefined') {
  module.exports = { getRMS, stripFences };
}
