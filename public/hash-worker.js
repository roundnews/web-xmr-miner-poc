// Import RandomX module
importScripts('/wasm/randomx.js');

let running = false;
let totalHashes = 0;
let workerId = null;
let randomxModule = null;
let initializationProgress = 0;

/**
 * Initialize RandomX module
 */
async function initializeRandomX() {
  try {
    randomxModule = new RandomXModule();
    
    // Generate a seed based on timestamp (in real mining, this comes from block template)
    const seed = `randomx-seed-${Date.now()}-${workerId}`;
    
    // Initialize with progress reporting
    self.postMessage({
      type: 'INIT_PROGRESS',
      workerId,
      progress: 0,
      message: 'Allocating memory...'
    });
    
    await randomxModule.init(seed);
    
    const memInfo = randomxModule.getMemoryInfo();
    
    self.postMessage({
      type: 'INIT_PROGRESS',
      workerId,
      progress: 100,
      message: 'RandomX initialized',
      memoryInfo: memInfo
    });
    
    return memInfo;
  } catch (error) {
    throw new Error(`Failed to initialize RandomX: ${error.message}`);
  }
}

/**
 * Calculate RandomX hash
 */
async function randomxHash(input) {
  if (!randomxModule || !randomxModule.initialized) {
    throw new Error('RandomX not initialized');
  }
  return await randomxModule.calculateHash(input);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function hashingLoop(config) {
  const { throttle, statsInterval } = config;
  let lastStatsTime = performance.now();
  let hashesSinceLastStats = 0;
  
  const workMs = Math.max(1, 100 - throttle);
  const sleepMs = Math.max(1, throttle);
  
  while (running) {
    const batchStart = performance.now();
    let batchHashes = 0;
    
    while (performance.now() - batchStart < workMs && running) {
      const input = `${workerId}-${totalHashes}-${Math.random()}`;
      await randomxHash(input);  // Use RandomX instead of SHA256
      totalHashes++;
      batchHashes++;
      hashesSinceLastStats++;
    }
    
    const now = performance.now();
    if (now - lastStatsTime >= statsInterval) {
      const elapsedSec = (now - lastStatsTime) / 1000;
      const memInfo = randomxModule ? randomxModule.getMemoryInfo() : null;
      self.postMessage({
        type: 'STATS',
        workerId,
        hashesDelta: hashesSinceLastStats,
        elapsedMs: now - lastStatsTime,
        totalHashes,
        hashrate: hashesSinceLastStats / elapsedSec,
        dutyCycle: (workMs / (workMs + sleepMs)) * 100,
        memoryUsageMB: memInfo ? memInfo.totalMB : 0
      });
      lastStatsTime = now;
      hashesSinceLastStats = 0;
    }
    
    if (sleepMs > 0 && running) {
      await sleep(sleepMs);
    }
  }
}

self.onmessage = async function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'INIT':
      workerId = data.workerId;
      try {
        const memInfo = await initializeRandomX();
        self.postMessage({
          type: 'READY',
          workerId,
          capabilities: {
            randomx: true,
            wasmSupport: typeof WebAssembly !== 'undefined',
            mode: memInfo.mode,
            memoryMB: memInfo.totalMB
          }
        });
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          workerId,
          error: 'Failed to initialize RandomX: ' + error.message,
          details: error.stack
        });
      }
      break;
      
    case 'START':
      if (!running) {
        running = true;
        totalHashes = 0;
        hashingLoop(data.config).catch(err => {
          self.postMessage({
            type: 'ERROR',
            workerId,
            error: err.message,
            details: err.stack
          });
        });
      }
      break;
      
    case 'STOP':
      running = false;
      self.postMessage({
        type: 'STOPPED',
        workerId,
        totalHashes
      });
      break;
      
    case 'UPDATE_CONFIG':
      break;
      
    case 'DESTROY':
      running = false;
      if (randomxModule) {
        randomxModule.destroy();
        randomxModule = null;
      }
      self.postMessage({
        type: 'DESTROYED',
        workerId
      });
      break;
      
    default:
      self.postMessage({
        type: 'ERROR',
        workerId,
        error: `Unknown message type: ${type}`
      });
  }
};
