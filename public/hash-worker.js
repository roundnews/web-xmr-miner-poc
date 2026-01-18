let running = false;
let totalHashes = 0;
let workerId = null;

async function sha256(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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
      await sha256(input);
      totalHashes++;
      batchHashes++;
      hashesSinceLastStats++;
    }
    
    const now = performance.now();
    if (now - lastStatsTime >= statsInterval) {
      const elapsedSec = (now - lastStatsTime) / 1000;
      self.postMessage({
        type: 'STATS',
        workerId,
        hashesDelta: hashesSinceLastStats,
        elapsedMs: now - lastStatsTime,
        totalHashes,
        hashrate: hashesSinceLastStats / elapsedSec,
        dutyCycle: (workMs / (workMs + sleepMs)) * 100
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
      self.postMessage({
        type: 'READY',
        workerId,
        capabilities: {
          cryptoSubtle: !!self.crypto?.subtle,
          performance: !!self.performance
        }
      });
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
      
    default:
      self.postMessage({
        type: 'ERROR',
        workerId,
        error: `Unknown message type: ${type}`
      });
  }
};
