import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkerCoordinator } from '@/lib/coordinator';
import { BenchmarkConfig } from '@/lib/types';

describe('WebGPU Backend Tests', () => {
  let config: BenchmarkConfig;

  beforeEach(() => {
    config = {
      threads: 1,
      throttle: 30,
      duration: 60,
      statsInterval: 1000,
      backend: 'webgpu'
    };
  });

  describe('WebGPU Backend Selection', () => {
    it('should select WebGPU backend when configured', () => {
      const coordinator = new WorkerCoordinator(config);
      const workerConfig = coordinator.getConfig();
      
      expect(workerConfig.backend).toBe('webgpu');
    });

    it('should select WASM backend when configured', () => {
      config.backend = 'wasm';
      const coordinator = new WorkerCoordinator(config);
      const workerConfig = coordinator.getConfig();
      
      expect(workerConfig.backend).toBe('wasm');
    });
  });

  describe('Worker Initialization', () => {
    it('should use WebGPU worker path when WebGPU backend is configured', () => {
      const originalWorker = global.Worker;
      const workerPaths: string[] = [];
      
      global.Worker = class MockWorker {
        constructor(public url: string) {
          workerPaths.push(url);
        }
        postMessage() {}
        terminate() {}
        addEventListener() {}
        removeEventListener() {}
        onmessage: ((ev: MessageEvent) => void) | null = null;
        onerror: ((ev: ErrorEvent) => void) | null = null;
      } as any;

      try {
        const coordinator = new WorkerCoordinator(config);
        coordinator.initialize();
        expect(workerPaths).toContain('/hash-worker-webgpu.js');
        coordinator.terminate();
      } finally {
        global.Worker = originalWorker;
      }
    });

    it('should use WASM worker path when WASM backend is configured', () => {
      config.backend = 'wasm';
      
      const originalWorker = global.Worker;
      const workerPaths: string[] = [];
      
      global.Worker = class MockWorker {
        constructor(public url: string) {
          workerPaths.push(url);
        }
        postMessage() {}
        terminate() {}
        addEventListener() {}
        removeEventListener() {}
        onmessage: ((ev: MessageEvent) => void) | null = null;
        onerror: ((ev: ErrorEvent) => void) | null = null;
      } as any;

      try {
        const coordinator = new WorkerCoordinator(config);
        coordinator.initialize();
        expect(workerPaths).toContain('/hash-worker.js');
        coordinator.terminate();
      } finally {
        global.Worker = originalWorker;
      }
    });
  });

  describe('Error Handling', () => {
    it('should track worker state when errors occur', () => {
      const coordinator = new WorkerCoordinator(config);
      
      const originalWorker = global.Worker;
      
      global.Worker = class MockWorker {
        constructor(public url: string) {
          // Simulate error after construction
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new ErrorEvent('error', {
                message: 'WebGPU not supported'
              }));
            }
          }, 10);
        }
        postMessage() {}
        terminate() {}
        addEventListener() {}
        removeEventListener() {}
        onmessage: ((ev: MessageEvent) => void) | null = null;
        onerror: ((ev: ErrorEvent) => void) | null = null;
      } as any;

      try {
        coordinator.initialize();
        const workers = coordinator.getWorkerInfo();
        
        // Workers should be initialized
        expect(workers.length).toBe(config.threads);
      } finally {
        global.Worker = originalWorker;
        coordinator.terminate();
      }
    });
  });

  describe('Worker Lifecycle', () => {
    it('should properly terminate workers', () => {
      const coordinator = new WorkerCoordinator(config);
      
      let terminateCalled = false;
      const originalWorker = global.Worker;
      
      global.Worker = class MockWorker {
        constructor(public url: string) {}
        postMessage() {}
        terminate() {
          terminateCalled = true;
        }
        addEventListener() {}
        removeEventListener() {}
        onmessage: ((ev: MessageEvent) => void) | null = null;
        onerror: ((ev: ErrorEvent) => void) | null = null;
      } as any;

      try {
        coordinator.initialize();
        coordinator.terminate();
        
        expect(terminateCalled).toBe(true);
        expect(coordinator.getWorkerInfo().length).toBe(0);
      } finally {
        global.Worker = originalWorker;
      }
    });
  });
});
