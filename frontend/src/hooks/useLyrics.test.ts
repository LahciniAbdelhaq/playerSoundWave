import { describe, it, expect } from 'vitest';
import { parseLrc } from './useLyrics';

describe('parseLrc', () => {
  it('parses "[mm:ss.xx] text" into time-sorted lines', () => {
    const lines = parseLrc('[00:12.50]Hello\n[00:05.00]First');
    expect(lines).toEqual([
      { time: 5, text: 'First' },
      { time: 12.5, text: 'Hello' },
    ]);
  });

  it('converts minutes + fractional seconds to total seconds', () => {
    const [line] = parseLrc('[01:30.250]Chorus');
    expect(line.time).toBeCloseTo(90.25, 3);
  });

  it('supports a line with multiple timestamps (repeated lyric)', () => {
    const lines = parseLrc('[00:10.00][00:20.00]Na na na');
    expect(lines.map((l) => l.time)).toEqual([10, 20]);
    expect(lines.every((l) => l.text === 'Na na na')).toBe(true);
  });

  it('keeps blank (instrumental) lines as empty text', () => {
    const [line] = parseLrc('[00:03.00]');
    expect(line).toEqual({ time: 3, text: '' });
  });

  it('ignores metadata / lines without a timestamp', () => {
    expect(parseLrc('[ar:Artist]\nplain text with no stamp')).toEqual([]);
  });

  it('accepts the colon-fraction variant "[mm:ss:xx]"', () => {
    const [line] = parseLrc('[00:08:40]Tag');
    expect(line.time).toBeCloseTo(8.4, 3);
  });
});
