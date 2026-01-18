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

// Helper function to create a mock Worker for testing
export function createMockWorker(options: {
  onConstruct?: (url: string) => void;
  onTerminate?: () => void;
  simulateReady?: boolean;
  simulateError?: boolean;
} = {}) {
  return class MockWorker {
    constructor(public url: string) {
      if (options.onConstruct) {
        options.onConstruct(url);
      }
      if (options.simulateReady) {
        setTimeout(() => {
          if (this.onmessage) {
            this.onmessage(new MessageEvent('message', {
              data: { type: 'READY', workerId: 0 }
            }));
          }
        }, 10);
      }
      if (options.simulateError) {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new ErrorEvent('error', {
              message: 'Test error'
            }));
          }
        }, 10);
      }
    }
    postMessage() {}
    terminate() {
      if (options.onTerminate) {
        options.onTerminate();
      }
    }
    addEventListener() {}
    removeEventListener() {}
    onmessage: ((ev: MessageEvent) => void) | null = null;
    onerror: ((ev: ErrorEvent) => void) | null = null;
  } as any;
}
