export interface WorkerStats {
  workerId: number;
  hashesDelta: number;
  elapsedMs: number;
  totalHashes: number;
  hashrate: number;
  dutyCycle: number;
  solutionsFound?: number;
  cacheReinitCount?: number;
}

export interface WorkerCapabilities {
  cryptoSubtle?: boolean;
  performance?: boolean;
  randomx?: boolean;
  wasmSupport?: boolean;
  webgpuSupport?: boolean;
  mode?: string;
  memoryMB?: number;
  backend?: string;
}

export interface BenchmarkConfig {
  threads: number;
  throttle: number;
  duration: number;
  statsInterval: number;
  mode?: 'light' | 'fast'; // RandomX mode
  backend?: 'wasm' | 'webgpu'; // Compute backend
}

export interface WorkerMessage {
  type: 'READY' | 'STATS' | 'ERROR' | 'STOPPED' | 'INIT_PROGRESS' | 'DESTROYED';
  workerId: number;
  hashesDelta?: number;
  elapsedMs?: number;
  totalHashes?: number;
  hashrate?: number;
  dutyCycle?: number;
  capabilities?: WorkerCapabilities;
  backend?: string;
  error?: string;
  details?: string;
  progress?: number;
  message?: string;
  memoryInfo?: {
    scratchpadSize: number;
    cacheSize: number;
    totalBytes: number;
    totalMB: number;
    mode: string;
    backend?: string;
  };
  memoryUsageMB?: number;
  solutionsFound?: number;
  cacheReinitCount?: number;
}

export type WorkerState = 'idle' | 'initializing' | 'running' | 'error' | 'stopped';

export interface WorkerInfo {
  id: number;
  state: WorkerState;
  worker: Worker | null;
  totalHashes: number;
  lastHashrate: number;
  error?: string;
  solutionsFound?: number;
  cacheReinitCount?: number;
  backend?: string;
}

export interface AggregatedStats {
  totalHashes: number;
  currentHashrate: number;
  peakHashrate: number;
  avgHashrate: number;
  runningWorkers: number;
  erroredWorkers: number;
  elapsedTime: number;
  totalSolutions?: number;
  totalCacheReinits?: number;
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
