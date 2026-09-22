import { vi } from 'vitest';

// jsdom doesn't implement HTMLMediaElement playback. Stub the methods the
// player store calls so audio side-effects are no-ops during tests.
window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
window.HTMLMediaElement.prototype.pause = vi.fn();
window.HTMLMediaElement.prototype.load = vi.fn();
