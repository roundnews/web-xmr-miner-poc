import { WorkerInfo, WorkerMessage, BenchmarkConfig, AggregatedStats } from './types';

export class WorkerCoordinator {
  private workers: WorkerInfo[] = [];
  private config: BenchmarkConfig;
  private startTime: number = 0;
  private timeSeriesData: Array<{ timestamp: number; hashrate: number; totalHashes: number }> = [];
  private intervalId: number | null = null;
  private durationTimeoutId: number | null = null;
  private onStatsUpdate: ((stats: AggregatedStats) => void) | null = null;
  private onComplete: (() => void) | null = null;

  constructor(config: BenchmarkConfig) {
    this.config = config;
  }

  setStatsCallback(callback: (stats: AggregatedStats) => void) {
    this.onStatsUpdate = callback;
  }

  setCompleteCallback(callback: () => void) {
    this.onComplete = callback;
  }

  async initialize(): Promise<void> {
    this.workers = Array.from({ length: this.config.threads }, (_, i) => ({
      id: i,
      state: 'initializing',
      worker: null,
      totalHashes: 0,
      lastHashrate: 0
    }));

    const initPromises = this.workers.map(async (workerInfo) => {
      try {
        const worker = new Worker('/hash-worker.js');
        workerInfo.worker = worker;

        worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
          this.handleWorkerMessage(workerInfo.id, e.data);
        };

        worker.onerror = (error) => {
          workerInfo.state = 'error';
          workerInfo.error = error.message;
          this.updateStats();
        };

        worker.postMessage({ type: 'INIT', data: { workerId: workerInfo.id } });

        await new Promise<void>((resolve) => {
          const checkReady = (e: MessageEvent<WorkerMessage>) => {
            if (e.data.type === 'READY' && e.data.workerId === workerInfo.id) {
              workerInfo.state = 'idle';
              worker.removeEventListener('message', checkReady);
              resolve();
            }
          };
          worker.addEventListener('message', checkReady);
        });
      } catch (error) {
        workerInfo.state = 'error';
        workerInfo.error = error instanceof Error ? error.message : 'Failed to initialize worker';
      }
    });

    await Promise.all(initPromises);
  }

  start(): void {
    this.startTime = performance.now();
    this.timeSeriesData = [];

    this.workers.forEach((workerInfo) => {
      if (workerInfo.worker && workerInfo.state === 'idle') {
        workerInfo.state = 'running';
        workerInfo.totalHashes = 0;
        workerInfo.lastHashrate = 0;
        workerInfo.worker.postMessage({
          type: 'START',
          data: {
            config: {
              throttle: this.config.throttle,
              statsInterval: this.config.statsInterval
            }
          }
        });
      }
    });

    this.intervalId = window.setInterval(() => {
      this.updateStats();
    }, 500);

    if (this.config.duration > 0) {
      this.durationTimeoutId = window.setTimeout(() => {
        this.stop();
        if (this.onComplete) {
          this.onComplete();
        }
      }, this.config.duration * 1000);
    }
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.durationTimeoutId !== null) {
      clearTimeout(this.durationTimeoutId);
      this.durationTimeoutId = null;
    }

    this.workers.forEach((workerInfo) => {
      if (workerInfo.worker && workerInfo.state === 'running') {
        workerInfo.worker.postMessage({ type: 'STOP' });
        workerInfo.state = 'stopped';
      }
    });

    this.updateStats();
  }

  terminate(): void {
    this.stop();
    this.workers.forEach((workerInfo) => {
      if (workerInfo.worker) {
        workerInfo.worker.terminate();
        workerInfo.worker = null;
      }
    });
    this.workers = [];
  }

  updateThrottle(throttle: number): void {
    this.config.throttle = throttle;
  }

  private handleWorkerMessage(workerId: number, message: WorkerMessage): void {
    const workerInfo = this.workers.find(w => w.id === workerId);
    if (!workerInfo) return;

    switch (message.type) {
      case 'STATS':
        if (message.totalHashes !== undefined) {
          workerInfo.totalHashes = message.totalHashes;
        }
        if (message.hashrate !== undefined) {
          workerInfo.lastHashrate = message.hashrate;
        }
        break;

      case 'ERROR':
        workerInfo.state = 'error';
        workerInfo.error = message.error;
        break;

      case 'STOPPED':
        workerInfo.state = 'stopped';
        if (message.totalHashes !== undefined) {
          workerInfo.totalHashes = message.totalHashes;
        }
        break;
    }
  }

  private updateStats(): void {
    const stats = this.getAggregatedStats();
    
    const currentTime = performance.now();
    this.timeSeriesData.push({
      timestamp: currentTime - this.startTime,
      hashrate: stats.currentHashrate,
      totalHashes: stats.totalHashes
    });

    if (this.timeSeriesData.length > 600) {
      this.timeSeriesData.shift();
    }

    if (this.onStatsUpdate) {
      this.onStatsUpdate(stats);
    }
  }

  getAggregatedStats(): AggregatedStats {
    const totalHashes = this.workers.reduce((sum, w) => sum + w.totalHashes, 0);
    const currentHashrate = this.workers
      .filter(w => w.state === 'running')
      .reduce((sum, w) => sum + w.lastHashrate, 0);
    
    const runningWorkers = this.workers.filter(w => w.state === 'running').length;
    const erroredWorkers = this.workers.filter(w => w.state === 'error').length;
    
    const elapsedTime = this.startTime > 0 ? (performance.now() - this.startTime) / 1000 : 0;
    
    const hashrates = this.timeSeriesData.map(d => d.hashrate);
    const peakHashrate = hashrates.length > 0 ? Math.max(...hashrates) : 0;
    const avgHashrate = hashrates.length > 0 
      ? hashrates.reduce((sum, h) => sum + h, 0) / hashrates.length 
      : 0;

    return {
      totalHashes,
      currentHashrate,
      peakHashrate,
      avgHashrate,
      runningWorkers,
      erroredWorkers,
      elapsedTime
    };
  }

  getTimeSeriesData() {
    return this.timeSeriesData;
  }

  getWorkerInfo(): WorkerInfo[] {
    return this.workers;
  }

  getConfig(): BenchmarkConfig {
    return this.config;
  }
}
