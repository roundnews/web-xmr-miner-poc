// Import RandomX module and block header utilities
importScripts('/wasm/randomx.js');
importScripts('/block-header.js');

let running = false;
let totalHashes = 0;
let workerId = null;
let randomxModule = null;
let initializationProgress = 0;

// Block header and nonce management
let blockTemplate = null;
let nonce = 0;
let nonceStart = 0;
let nonceEnd = 0;
let difficultyTarget = BigInt(0);
let solutionsFound = 0;
let cacheReinitCount = 0;
let lastCacheReinit = 0;
let totalWorkers = 1;

/**
 * Initialize RandomX module
 */
async function initializeRandomX(mode = 'light') {
  try {
    randomxModule = new RandomXModule(mode);
    
    // Generate a cryptographically secure seed
    // In real mining, this comes from block template
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    
    // Convert to hex efficiently
    let hexSeed = '';
    for (let i = 0; i < randomBytes.length; i++) {
      hexSeed += randomBytes[i].toString(16).padStart(2, '0');
    }
    const seed = `randomx-seed-${hexSeed}-${workerId}`;
    
    // Initialize with progress reporting
    const progressCallback = (progress, message) => {
      self.postMessage({
        type: 'INIT_PROGRESS',
        workerId,
        progress,
        message
      });
    };
    
    progressCallback(0, 'Starting initialization...');
    await randomxModule.init(seed, progressCallback);
    
    const memInfo = randomxModule.getMemoryInfo();
    
    self.postMessage({
      type: 'INIT_PROGRESS',
      workerId,
      progress: 100,
      message: `RandomX ${mode} mode initialized`,
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
  
  const CACHE_REINIT_INTERVAL = 120000; // 120 seconds (2 minutes like Monero)
  lastCacheReinit = performance.now();
  
  while (running) {
    const batchStart = performance.now();
    let batchHashes = 0;
    
    // Check for cache reinitialization (simulates blockchain height change)
    const now = performance.now();
    if (now - lastCacheReinit >= CACHE_REINIT_INTERVAL) {
      // Simulate blockchain height change - reinitialize cache
      const newSeed = generateNewSeed();
      await randomxModule.init(newSeed, null);
      lastCacheReinit = now;
      cacheReinitCount++;
      
      // Update block template with new timestamp
      blockTemplate.updateTimestamp(Math.floor(Date.now() / 1000));
      
      console.log(`Worker ${workerId}: Cache reinitialized (count: ${cacheReinitCount})`);
    }
    
    while (performance.now() - batchStart < workMs && running) {
      // Set nonce in block header
      blockTemplate.setNonce(nonce);
      
      // Serialize to binary (76 bytes)
      const headerBytes = blockTemplate.serialize();
      
      // Hash the binary header
      const hash = await randomxHash(headerBytes);
      
      // Compare against difficulty (adds realistic overhead)
      const hashValue = BigInt('0x' + hash);
      if (hashValue < difficultyTarget) {
        // Found solution (log but don't stop - educational)
        console.log(`Worker ${workerId} found solution at nonce ${nonce}, hash: ${hash}`);
        solutionsFound++;
      }
      
      // Increment nonce sequentially
      nonce++;
      
      // Wrap around if we exceed our partition
      if (nonce >= nonceEnd) {
        nonce = nonceStart;
      }
      
      totalHashes++;
      batchHashes++;
      hashesSinceLastStats++;
    }
    
    const currentTime = performance.now();
    if (currentTime - lastStatsTime >= statsInterval) {
      const elapsedSec = (currentTime - lastStatsTime) / 1000;
      const memInfo = randomxModule ? randomxModule.getMemoryInfo() : null;
      self.postMessage({
        type: 'STATS',
        workerId,
        hashesDelta: hashesSinceLastStats,
        elapsedMs: currentTime - lastStatsTime,
        totalHashes,
        hashrate: hashesSinceLastStats / elapsedSec,
        dutyCycle: (workMs / (workMs + sleepMs)) * 100,
        memoryUsageMB: memInfo ? memInfo.totalMB : 0,
        solutionsFound,
        cacheReinitCount
      });
      lastStatsTime = currentTime;
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
      totalWorkers = data.totalWorkers || 1;
      try {
        // Support mode selection (default to 'light')
        const mode = data.mode || 'light';
        const memInfo = await initializeRandomX(mode);
        
        // Partition nonce space for this worker
        const { nonceStart: start, nonceEnd: end } = partitionNonceSpace(workerId, totalWorkers);
        nonceStart = start;
        nonce = start;
        nonceEnd = end;
        
        // Create mock block template
        blockTemplate = new BlockHeader(
          1,  // version
          '0000000000000000000000000000000000000000000000000000000000000000',  // prev hash
          generateMerkleRoot(),  // merkle root
          Math.floor(Date.now() / 1000),  // timestamp
          0  // initial nonce
        );
        
        // Set realistic difficulty target
        // This target will find solutions roughly every 10-100 million hashes
        // Adjusted to be achievable within reasonable benchmark duration
        difficultyTarget = BigInt('0x00000000FFFF0000000000000000000000000000000000000000000000000000');
        
        console.log(`Worker ${workerId}: Nonce range ${nonceStart} to ${nonceEnd}`);
        
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
        solutionsFound = 0;
        cacheReinitCount = 0;
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
