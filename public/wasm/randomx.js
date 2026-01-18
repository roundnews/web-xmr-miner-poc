/**
 * RandomX-Lite WASM Simulation
 * 
 * This is a simplified simulation of RandomX algorithm characteristics for educational purposes.
 * It demonstrates:
 * - Memory-hard characteristics (large scratchpad)
 * - CPU-intensive hashing operations
 * - Initialization overhead
 * - Realistic performance profiles
 * - Both light mode (256MB) and fast mode (2GB+) support
 * 
 * For production use, this should be replaced with the official RandomX WASM implementation.
 * See: https://github.com/tevador/RandomX
 */

// Constants for VM execution rounds
const LIGHT_MODE_ROUNDS = 8;  // More rounds for light mode (slower but less memory)
const FAST_MODE_ROUNDS = 4;   // Fewer rounds for fast mode (faster with dataset)
const DATASET_PROGRESS_INTERVAL = 10;  // Report progress every 10% during dataset generation

class RandomXModule {
  constructor(mode = 'light') {
    this.initialized = false;
    this.cache = null;
    this.dataset = null;
    this.scratchpad = null;
    this.mode = mode;
    
    // Set memory sizes based on mode
    if (mode === 'fast') {
      this.scratchpadSize = 2 * 1024 * 1024 * 1024; // 2GB for fast mode
      this.datasetSize = 2 * 1024 * 1024 * 1024; // 2GB dataset
      this.cacheSize = 2 * 1024 * 1024; // 2MB cache
    } else {
      // Light mode (default)
      this.scratchpadSize = 256 * 1024 * 1024; // 256MB for light mode
      this.cacheSize = 2 * 1024 * 1024; // 2MB cache
      this.datasetSize = 0; // No dataset in light mode
    }
  }

  /**
   * Initialize the RandomX cache with a seed key
   * This simulates the slow initialization phase of RandomX
   */
  async init(seedKey, progressCallback) {
    if (this.initialized) {
      return;
    }

    // Allocate scratchpad (simulating memory-hard requirement)
    if (progressCallback) progressCallback(10, 'Allocating scratchpad...');
    this.scratchpad = new Uint8Array(this.scratchpadSize);
    
    // Allocate cache
    if (progressCallback) progressCallback(20, 'Allocating cache...');
    this.cache = new Uint8Array(this.cacheSize);

    // In fast mode, allocate dataset
    if (this.mode === 'fast') {
      if (progressCallback) progressCallback(30, 'Allocating dataset (2GB)...');
      this.dataset = new Uint8Array(this.datasetSize);
    }

    // Simulate cache initialization (Argon2d-like process)
    // In real RandomX, this takes 1-5 seconds for light mode, 10-30 seconds for fast mode
    const seed = this.stringToBytes(seedKey);
    await this.initializeCache(seed, progressCallback);

    this.initialized = true;
    if (progressCallback) progressCallback(100, `RandomX ${this.mode} mode initialized`);
  }

  /**
   * Simulate cache initialization with progressive filling
   * Mimics Argon2d + SuperscalarHash behavior
   */
  async initializeCache(seed, progressCallback) {
    // Fill cache with derived data
    if (progressCallback) progressCallback(40, 'Filling cache...');
    for (let i = 0; i < this.cache.length; i += 64) {
      const block = await this.sha256Mix(seed, i);
      for (let j = 0; j < Math.min(64, this.cache.length - i); j++) {
        this.cache[i + j] = block[j % 32];
      }
    }

    // In fast mode, generate full dataset from cache
    if (this.mode === 'fast') {
      if (progressCallback) progressCallback(50, 'Generating dataset from cache...');
      await this.generateDataset(progressCallback);
    }

    // Fill scratchpad using cache (or dataset in fast mode)
    if (progressCallback) progressCallback(70, 'Filling scratchpad...');
    let yieldCounter = 0;
    const yieldThreshold = 16384; // Yield every ~1MB
    
    for (let i = 0; i < this.scratchpad.length; i += 64) {
      const sourceData = this.mode === 'fast' && this.dataset ? this.dataset : this.cache;
      const sourceIndex = i % sourceData.length;
      const block = sourceData.slice(sourceIndex, Math.min(sourceIndex + 64, sourceData.length));
      for (let j = 0; j < Math.min(64, this.scratchpad.length - i); j++) {
        this.scratchpad[i + j] = block[j % block.length] ^ (i & 0xFF);
      }
      
      // Yield periodically to avoid blocking (using counter instead of modulo)
      yieldCounter++;
      if (yieldCounter >= yieldThreshold) {
        await this.sleep(0);
        yieldCounter = 0;
      }
    }
  }

  /**
   * Generate dataset from cache (fast mode only)
   * 
   * In fast mode, RandomX uses a pre-computed dataset derived from the cache.
   * This dataset is used during hash calculation to improve performance.
   * The dataset is 2GB in size and takes 10-30 seconds to generate.
   * 
   * In real RandomX, this uses SuperscalarHash for dataset item generation.
   * This simulation uses a simplified derivation from the cache.
   * 
   * @param {Function} progressCallback - Optional callback for progress updates (progress%, message)
   */
  async generateDataset(progressCallback) {
    if (!this.dataset) return;

    let yieldCounter = 0;
    const yieldThreshold = 32768; // Yield every ~2MB
    
    for (let i = 0; i < this.dataset.length; i += 64) {
      // Generate dataset item from cache
      const cacheIndex = (i / 64) % (this.cache.length / 64);
      const cacheOffset = cacheIndex * 64;
      
      // Simple derivation (in real RandomX, this is much more complex)
      for (let j = 0; j < 64 && i + j < this.dataset.length; j++) {
        const cacheValue = this.cache[(cacheOffset + j) % this.cache.length];
        this.dataset[i + j] = cacheValue ^ ((i + j) & 0xFF);
      }
      
      // Progress reporting every DATASET_PROGRESS_INTERVAL percent
      if (yieldCounter % (yieldThreshold * DATASET_PROGRESS_INTERVAL) === 0 && progressCallback) {
        const progress = 50 + Math.floor((i / this.dataset.length) * 20);
        progressCallback(progress, `Generating dataset... ${Math.floor((i / this.dataset.length) * 100)}%`);
      }
      
      // Yield periodically to avoid blocking
      yieldCounter++;
      if (yieldCounter >= yieldThreshold) {
        await this.sleep(0);
        yieldCounter = 0;
      }
    }
  }

  /**
   * Calculate RandomX hash
   * Simulates the VM execution with scratchpad mixing
   * Fast mode uses dataset for better performance and fewer rounds
   */
  async calculateHash(input) {
    if (!this.initialized) {
      throw new Error('RandomX not initialized. Call init() first.');
    }

    // Support both Uint8Array and string inputs
    const inputBytes = input instanceof Uint8Array 
      ? input 
      : this.stringToBytes(input);
    
    let hash = await this.sha256(inputBytes);

    // Simulate RandomX VM execution with multiple rounds
    // Fast mode has fewer rounds but better performance due to dataset
    const rounds = this.mode === 'fast' ? FAST_MODE_ROUNDS : LIGHT_MODE_ROUNDS;
    for (let round = 0; round < rounds; round++) {
      // Mix with scratchpad (memory-hard operation)
      hash = await this.scratchpadMix(hash, round);
      
      // Simulate program execution (CPU-intensive)
      hash = await this.programExecution(hash, round);
    }

    // Final hash
    return this.bytesToHex(hash);
  }

  /**
   * Simulate scratchpad mixing (memory-hard)
   * Reads/writes to scratchpad based on hash state
   */
  async scratchpadMix(hash, round) {
    const mixed = new Uint8Array(32);
    // Pre-calculate mask for efficient modulo (scratchpadSize is power of 2)
    const scratchpadMask = this.scratchpad.length - 1;
    
    for (let i = 0; i < 32; i++) {
      // Read from scratchpad using hash as index with bitwise AND
      // Ensure proper alignment by masking before multiplication
      const readOffset = ((hash[i] << 8) | hash[(i + 1) % 32]) & 0xFFFF;
      const readIndex = (readOffset * 64) & scratchpadMask;
      const scratchValue = this.scratchpad[readIndex];
      
      // Mix
      mixed[i] = hash[i] ^ scratchValue ^ round;
      
      // Write back to scratchpad
      const writeOffset = ((hash[(i + 2) % 32] << 8) | hash[(i + 3) % 32]) & 0xFFFF;
      const writeIndex = (writeOffset * 64) & scratchpadMask;
      this.scratchpad[writeIndex] = (this.scratchpad[writeIndex] + hash[i] + round) & 0xFF;
    }
    
    return mixed;
  }

  /**
   * Simulate RandomX program execution
   * Multiple hash operations to simulate CPU-intensive work
   */
  async programExecution(hash, round) {
    // Multiple mixing operations to slow down computation
    for (let i = 0; i < 4; i++) {
      hash = await this.sha256Mix(hash, round * 4 + i);
    }
    return hash;
  }

  /**
   * SHA256 with mixing
   */
  async sha256Mix(data, nonce) {
    const nonceBytes = new Uint8Array([
      nonce & 0xFF,
      (nonce >> 8) & 0xFF,
      (nonce >> 16) & 0xFF,
      (nonce >> 24) & 0xFF
    ]);
    const combined = new Uint8Array(data.length + nonceBytes.length);
    combined.set(data);
    combined.set(nonceBytes, data.length);
    return await this.sha256(combined);
  }

  /**
   * SHA256 hash function
   */
  async sha256(data) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }

  /**
   * Convert string to bytes
   */
  stringToBytes(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }

  /**
   * Convert bytes to hex string
   */
  bytesToHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get memory usage info
   */
  getMemoryInfo() {
    return {
      scratchpadSize: this.scratchpadSize,
      cacheSize: this.cacheSize,
      datasetSize: this.datasetSize || 0,
      totalBytes: this.scratchpadSize + this.cacheSize + (this.datasetSize || 0),
      totalMB: Math.round((this.scratchpadSize + this.cacheSize + (this.datasetSize || 0)) / (1024 * 1024)),
      mode: this.mode
    };
  }

  /**
   * Release memory
   */
  destroy() {
    this.scratchpad = null;
    this.cache = null;
    this.dataset = null;
    this.initialized = false;
  }
}

// Export for use in worker
if (typeof self !== 'undefined' && typeof self.postMessage !== 'undefined') {
  // Running in a worker context
  self.RandomXModule = RandomXModule;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RandomXModule;
}
