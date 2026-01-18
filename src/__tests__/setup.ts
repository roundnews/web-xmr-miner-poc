import '@testing-library/jest-dom';

// Mock navigator.gpu for WebGPU tests
if (typeof navigator !== 'undefined' && !navigator.gpu) {
  Object.defineProperty(navigator, 'gpu', {
    value: undefined,
    writable: true,
    configurable: true
  });
}

// Mock Worker
if (typeof Worker === 'undefined') {
  global.Worker = class Worker {
    constructor(public url: string) {}
    postMessage() {}
    terminate() {}
    addEventListener() {}
    removeEventListener() {}
    onmessage = null;
    onerror = null;
  } as any;
}
