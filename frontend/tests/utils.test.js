const { getRMS, stripFences } = require('../utils.js');

describe('getRMS', () => {
  test('silence (all zeros) returns 0', () => {
    expect(getRMS([0, 0, 0, 0])).toBe(0);
  });

  test('full amplitude (all 1.0) returns 1', () => {
    expect(getRMS([1, 1, 1, 1])).toBe(1);
  });

  test('known values: [3, 4] returns 2.5 (sqrt of 12.5)', () => {
    // RMS([3,4]) = sqrt((9+16)/2) = sqrt(12.5)
    expect(getRMS([3, 4])).toBeCloseTo(Math.sqrt(12.5), 10);
  });

  test('mixed positive and negative: [-1, 1] returns 1', () => {
    expect(getRMS([-1, 1])).toBeCloseTo(1, 10);
  });
});

describe('stripFences', () => {
  test('strips ```js ... ``` fences', () => {
    const input = '```js\nstack(s("bd"))\n```';
    expect(stripFences(input)).toBe('stack(s("bd"))');
  });

  test('strips plain ``` fences', () => {
    const input = '```\nstack(s("bd"))\n```';
    expect(stripFences(input)).toBe('stack(s("bd"))');
  });

  test('leaves plain code untouched', () => {
    const input = 'stack(s("bd"))';
    expect(stripFences(input)).toBe('stack(s("bd"))');
  });

  test('trims surrounding whitespace', () => {
    const input = '  \n  stack(s("bd"))  \n  ';
    expect(stripFences(input)).toBe('stack(s("bd"))');
  });
});
