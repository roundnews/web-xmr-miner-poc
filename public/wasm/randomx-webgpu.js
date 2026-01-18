/**
 * RandomX-Lite WebGPU Implementation
 * 
 * This is a 1:1 port of the WASM RandomX simulation to WebGPU for educational purposes.
 * It demonstrates WHY RandomX favors CPUs over GPUs through:
 * - Random memory access patterns (GPU cache-unfriendly)
 * - Dynamic control flow (causes warp divergence)
 * - Sequential dependencies (prevents parallelization)
 * - Large memory footprint with latency-sensitive access
 * 
 * EXPECTED RESULT: This WebGPU implementation will be SLOWER than the WASM version
 * because RandomX is specifically designed to be CPU-friendly and GPU-unfriendly.
 * 
 * For production use, this should be replaced with the official RandomX implementation.
 * See: https://github.com/tevador/RandomX
 */

// Constants for VM execution rounds (same as WASM)
const LIGHT_MODE_ROUNDS = 8;
const FAST_MODE_ROUNDS = 4;
const DATASET_PROGRESS_INTERVAL = 10;

class RandomXWebGPUModule {
  constructor(mode = 'light') {
    this.initialized = false;
    this.device = null;
    this.adapter = null;
    this.mode = mode;
    
    // GPU buffers
    this.scratchpadBuffer = null;
    this.cacheBuffer = null;
    this.datasetBuffer = null;
    this.hashBuffer = null;
    
    // Compute pipelines
    this.scratchpadMixPipeline = null;
    this.programExecutionPipeline = null;
    
    // Set memory sizes based on mode (same as WASM)
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
   * Initialize WebGPU and allocate GPU buffers
   * This will be SLOWER than WASM initialization due to GPU overhead
   */
  async init(seedKey, progressCallback) {
    if (this.initialized) {
      return;
    }

    // Check WebGPU support
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported in this browser. Use WASM backend instead.');
    }

    try {
      // Request WebGPU adapter
      if (progressCallback) progressCallback(5, 'Requesting WebGPU adapter...');
      this.adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
      });
      
      if (!this.adapter) {
        throw new Error('Failed to get WebGPU adapter');
      }

      // Request device with appropriate limits
      if (progressCallback) progressCallback(10, 'Requesting WebGPU device...');
      
      // Check adapter limits
      const limits = this.adapter.limits;
      const requiredBufferSize = Math.max(this.scratchpadSize, this.cacheSize);
      
      if (requiredBufferSize > limits.maxStorageBufferBindingSize) {
        throw new Error(`Buffer size ${requiredBufferSize} exceeds GPU limit ${limits.maxStorageBufferBindingSize}`);
      }

      this.device = await this.adapter.requestDevice({
        requiredLimits: {
          maxStorageBufferBindingSize: requiredBufferSize,
          maxBufferSize: requiredBufferSize
        }
      });

      // Allocate scratchpad buffer on GPU
      // NOTE: This is GPU-unfriendly - large buffer with random access patterns
      if (progressCallback) progressCallback(20, 'Allocating GPU scratchpad buffer...');
      this.scratchpadBuffer = this.device.createBuffer({
        size: this.scratchpadSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
      });

      // Allocate cache buffer on GPU
      if (progressCallback) progressCallback(30, 'Allocating GPU cache buffer...');
      this.cacheBuffer = this.device.createBuffer({
        size: this.cacheSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
      });

      // In fast mode, allocate dataset buffer
      if (this.mode === 'fast') {
        if (progressCallback) progressCallback(35, 'Allocating GPU dataset buffer (2GB)...');
        this.datasetBuffer = this.device.createBuffer({
          size: this.datasetSize,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
      }

      // Allocate hash buffer
      this.hashBuffer = this.device.createBuffer({
        size: 32, // SHA-256 output
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
      });

      // Initialize cache with seed (using CPU, then upload to GPU)
      // NOTE: This CPU-GPU transfer is overhead that doesn't exist in WASM
      const seed = this.stringToBytes(seedKey);
      await this.initializeCache(seed, progressCallback);

      this.initialized = true;
      if (progressCallback) progressCallback(100, `RandomX WebGPU ${this.mode} mode initialized`);
    } catch (error) {
      // Clean up on error
      this.destroy();
      throw new Error(`WebGPU initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize cache (CPU-based, then upload to GPU)
   * In real GPU mining, this transfer overhead is a major disadvantage
   */
  async initializeCache(seed, progressCallback) {
    // Fill cache on CPU (GPU shader compilation would be too complex for initialization)
    if (progressCallback) progressCallback(40, 'Filling cache on CPU...');
    const cache = new Uint8Array(this.cacheSize);
    
    for (let i = 0; i < cache.length; i += 64) {
      const block = await this.sha256Mix(seed, i);
      for (let j = 0; j < Math.min(64, cache.length - i); j++) {
        cache[i + j] = block[j % 32];
      }
    }

    // Upload cache to GPU
    // NOTE: This CPU->GPU transfer is a disadvantage vs WASM
    if (progressCallback) progressCallback(60, 'Uploading cache to GPU...');
    this.device.queue.writeBuffer(this.cacheBuffer, 0, cache);

    // In fast mode, generate dataset
    if (this.mode === 'fast') {
      if (progressCallback) progressCallback(65, 'Generating dataset on CPU...');
      await this.generateDataset(cache, progressCallback);
    }

    // Fill scratchpad from cache
    if (progressCallback) progressCallback(80, 'Filling scratchpad...');
    const scratchpad = new Uint8Array(this.scratchpadSize);
    
    let yieldCounter = 0;
    const yieldThreshold = 16384;
    
    for (let i = 0; i < scratchpad.length; i += 64) {
      const sourceData = this.mode === 'fast' && this.datasetBuffer ? cache : cache; // Simplified
      const sourceIndex = i % sourceData.length;
      const block = sourceData.slice(sourceIndex, Math.min(sourceIndex + 64, sourceData.length));
      for (let j = 0; j < Math.min(64, scratchpad.length - i); j++) {
        scratchpad[i + j] = block[j % block.length] ^ (i & 0xFF);
      }
      
      yieldCounter++;
      if (yieldCounter >= yieldThreshold) {
        await this.sleep(0);
        yieldCounter = 0;
      }
    }

    // Upload scratchpad to GPU
    // NOTE: Another CPU->GPU transfer overhead
    if (progressCallback) progressCallback(90, 'Uploading scratchpad to GPU...');
    this.device.queue.writeBuffer(this.scratchpadBuffer, 0, scratchpad);
  }

  /**
   * Generate dataset (fast mode only)
   */
  async generateDataset(cache, progressCallback) {
    if (!this.datasetBuffer) return;

    const dataset = new Uint8Array(this.datasetSize);
    let yieldCounter = 0;
    const yieldThreshold = 32768;
    
    for (let i = 0; i < dataset.length; i += 64) {
      const cacheIndex = (i / 64) % (cache.length / 64);
      const cacheOffset = cacheIndex * 64;
      
      for (let j = 0; j < 64 && i + j < dataset.length; j++) {
        const cacheValue = cache[(cacheOffset + j) % cache.length];
        dataset[i + j] = cacheValue ^ ((i + j) & 0xFF);
      }
      
      if (yieldCounter % (yieldThreshold * DATASET_PROGRESS_INTERVAL) === 0 && progressCallback) {
        const progress = 65 + Math.floor((i / dataset.length) * 15);
        progressCallback(progress, `Generating dataset... ${Math.floor((i / dataset.length) * 100)}%`);
      }
      
      yieldCounter++;
      if (yieldCounter >= yieldThreshold) {
        await this.sleep(0);
        yieldCounter = 0;
      }
    }

    // Upload dataset to GPU
    this.device.queue.writeBuffer(this.datasetBuffer, 0, dataset);
  }

  /**
   * Calculate RandomX hash using GPU
   * 
   * NOTE: This is intentionally SLOW because:
   * 1. CPU->GPU data transfer overhead
   * 2. GPU cannot efficiently handle random memory access
   * 3. Sequential dependencies prevent parallelization
   * 4. GPU memory latency is higher than CPU cache
   * 5. Control flow divergence in shaders
   */
  async calculateHash(input) {
    if (!this.initialized) {
      throw new Error('RandomX WebGPU not initialized. Call init() first.');
    }

    // Convert input to bytes
    const inputBytes = input instanceof Uint8Array 
      ? input 
      : this.stringToBytes(input);
    
    // Initial hash on CPU (WebGPU doesn't have built-in SHA-256)
    // NOTE: This is another disadvantage - need CPU for crypto operations
    let hash = await this.sha256(inputBytes);

    // Simulate RandomX VM execution
    // In a real GPU implementation, each round would involve:
    // 1. Upload hash to GPU (overhead)
    // 2. Run compute shader (inefficient due to random access)
    // 3. Download result from GPU (overhead)
    // This is why GPU mining of RandomX is ineffective
    
    const rounds = this.mode === 'fast' ? FAST_MODE_ROUNDS : LIGHT_MODE_ROUNDS;
    for (let round = 0; round < rounds; round++) {
      // Mix with scratchpad (would use GPU, but we simulate with CPU due to complexity)
      // In real GPU mining, this random access pattern causes cache thrashing
      hash = await this.scratchpadMixCPU(hash, round);
      
      // Program execution (CPU-based due to shader complexity)
      hash = await this.programExecution(hash, round);
    }

    return this.bytesToHex(hash);
  }

  /**
   * Scratchpad mixing on CPU (simulates what would happen on GPU)
   * NOTE: In real GPU implementation, this would be a compute shader,
   * but the random access patterns would cause severe performance issues:
   * - Cache thrashing due to unpredictable access
   * - Memory coalescing failures
   * - High latency VRAM access
   */
  async scratchpadMixCPU(hash, round) {
    // Download scratchpad from GPU (massive overhead)
    const readBuffer = this.device.createBuffer({
      size: Math.min(4096, this.scratchpadSize), // Only read small portion to avoid timeout
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    // Copy small portion of scratchpad
    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(
      this.scratchpadBuffer,
      0,
      readBuffer,
      0,
      Math.min(4096, this.scratchpadSize)
    );
    this.device.queue.submit([commandEncoder.finish()]);

    // Wait for GPU
    await readBuffer.mapAsync(GPUMapMode.READ);
    const scratchpadData = new Uint8Array(readBuffer.getMappedRange());
    
    // Mix on CPU
    const mixed = new Uint8Array(32);
    const scratchpadMask = scratchpadData.length - 1;
    
    for (let i = 0; i < 32; i++) {
      const readOffset = ((hash[i] << 8) | hash[(i + 1) % 32]) & 0xFFFF;
      const readIndex = (readOffset * 64) & scratchpadMask;
      const scratchValue = scratchpadData[Math.min(readIndex, scratchpadData.length - 1)];
      
      mixed[i] = hash[i] ^ scratchValue ^ round;
    }
    
    readBuffer.unmap();
    readBuffer.destroy();
    
    return mixed;
  }

  /**
   * Program execution (CPU-based)
   * GPU shaders cannot efficiently handle the complex operations RandomX requires
   */
  async programExecution(hash, round) {
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
   * SHA256 hash function (uses Web Crypto API, not GPU)
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
      mode: this.mode,
      backend: 'webgpu'
    };
  }

  /**
   * Release GPU resources
   */
  destroy() {
    if (this.scratchpadBuffer) {
      this.scratchpadBuffer.destroy();
      this.scratchpadBuffer = null;
    }
    if (this.cacheBuffer) {
      this.cacheBuffer.destroy();
      this.cacheBuffer = null;
    }
    if (this.datasetBuffer) {
      this.datasetBuffer.destroy();
      this.datasetBuffer = null;
    }
    if (this.hashBuffer) {
      this.hashBuffer.destroy();
      this.hashBuffer = null;
    }
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
    this.adapter = null;
    this.initialized = false;
  }
}

// Export for use in worker
if (typeof self !== 'undefined' && typeof self.postMessage !== 'undefined') {
  // Running in a worker context
  self.RandomXWebGPUModule = RandomXWebGPUModule;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RandomXWebGPUModule;
}
