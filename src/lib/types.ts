export interface WorkerStats {
  workerId: number;
  hashesDelta: number;
  elapsedMs: number;
  totalHashes: number;
  hashrate: number;
  dutyCycle: number;
}

export interface WorkerCapabilities {
  cryptoSubtle: boolean;
  performance: boolean;
}

export interface BenchmarkConfig {
  threads: number;
  throttle: number;
  duration: number;
  statsInterval: number;
}

export interface WorkerMessage {
  type: 'READY' | 'STATS' | 'ERROR' | 'STOPPED';
  workerId: number;
  hashesDelta?: number;
  elapsedMs?: number;
  totalHashes?: number;
  hashrate?: number;
  dutyCycle?: number;
  capabilities?: WorkerCapabilities;
  error?: string;
  details?: string;
}

export type WorkerState = 'idle' | 'initializing' | 'running' | 'error' | 'stopped';

export interface WorkerInfo {
  id: number;
  state: WorkerState;
  worker: Worker | null;
  totalHashes: number;
  lastHashrate: number;
  error?: string;
}

export interface AggregatedStats {
  totalHashes: number;
  currentHashrate: number;
  peakHashrate: number;
  avgHashrate: number;
  runningWorkers: number;
  erroredWorkers: number;
  elapsedTime: number;
}

export interface BenchmarkReport {
  timestamp: string;
  config: BenchmarkConfig;
  deviceInfo: {
    userAgent: string;
    hardwareConcurrency: number;
    memory?: number;
  };
  stats: AggregatedStats;
  timeSeriesData: Array<{
    timestamp: number;
    hashrate: number;
    totalHashes: number;
  }>;
  workerData: Array<{
    workerId: number;
    totalHashes: number;
    finalState: WorkerState;
    error?: string;
  }>;
}
