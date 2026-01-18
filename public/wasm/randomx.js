/**
 * RandomX-Lite WASM Simulation
 * 
 * This is a simplified simulation of RandomX algorithm characteristics for educational purposes.
 * It demonstrates:
 * - Memory-hard characteristics (large scratchpad)
 * - CPU-intensive hashing operations
 * - Initialization overhead
 * - Realistic performance profiles
 * 
 * For production use, this should be replaced with the official RandomX WASM implementation.
 * See: https://github.com/tevador/RandomX
 */

class RandomXModule {
  constructor() {
    this.initialized = false;
    this.cache = null;
    this.scratchpad = null;
    this.scratchpadSize = 256 * 1024 * 1024; // 256MB for light mode
    this.cacheSize = 2 * 1024 * 1024; // 2MB cache
  }

  /**
   * Initialize the RandomX cache with a seed key
   * This simulates the slow initialization phase of RandomX
   */
  async init(seedKey) {
    if (this.initialized) {
      return;
    }

    // Allocate scratchpad (simulating memory-hard requirement)
    this.scratchpad = new Uint8Array(this.scratchpadSize);
    this.cache = new Uint8Array(this.cacheSize);

    // Simulate cache initialization (Argon2d-like process)
    // In real RandomX, this takes 1-5 seconds
    const seed = this.stringToBytes(seedKey);
    await this.initializeCache(seed);

    this.initialized = true;
  }

  /**
   * Simulate cache initialization with progressive filling
   * Mimics Argon2d + SuperscalarHash behavior
   */
  async initializeCache(seed) {
    // Fill cache with derived data
    for (let i = 0; i < this.cache.length; i += 64) {
      const block = await this.sha256Mix(seed, i);
      for (let j = 0; j < Math.min(64, this.cache.length - i); j++) {
        this.cache[i + j] = block[j % 32];
      }
    }

    // Fill scratchpad using cache
    let yieldCounter = 0;
    const yieldThreshold = 16384; // Yield every ~1MB
    
    for (let i = 0; i < this.scratchpad.length; i += 64) {
      const cacheIndex = i % this.cache.length;
      const block = this.cache.slice(cacheIndex, Math.min(cacheIndex + 64, this.cache.length));
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
   * Calculate RandomX hash
   * Simulates the VM execution with scratchpad mixing
   */
  async calculateHash(input) {
    if (!this.initialized) {
      throw new Error('RandomX not initialized. Call init() first.');
    }

    const inputBytes = this.stringToBytes(input);
    let hash = await this.sha256(inputBytes);

    // Simulate RandomX VM execution with multiple rounds
    // Real RandomX does 8 program iterations
    for (let round = 0; round < 8; round++) {
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
      const readIndex = (((hash[i] << 8) | hash[(i + 1) % 32]) * 64) & scratchpadMask;
      const scratchValue = this.scratchpad[readIndex];
      
      // Mix
      mixed[i] = hash[i] ^ scratchValue ^ round;
      
      // Write back to scratchpad
      const writeIndex = (((hash[(i + 2) % 32] << 8) | hash[(i + 3) % 32]) * 64) & scratchpadMask;
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
      totalBytes: this.scratchpadSize + this.cacheSize,
      totalMB: Math.round((this.scratchpadSize + this.cacheSize) / (1024 * 1024)),
      mode: 'light'
    };
  }

  /**
   * Release memory
   */
  destroy() {
    this.scratchpad = null;
    this.cache = null;
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
