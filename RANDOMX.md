# RandomX Implementation

## Overview

This application now uses a RandomX-Lite simulation to demonstrate browser-based Monero (XMR) mining characteristics. RandomX is Monero's proof-of-work algorithm, designed to be memory-hard and CPU-optimized.

## What is RandomX?

RandomX is a Proof-of-Work (PoW) algorithm that is optimized for general-purpose CPUs. It was designed to:

- **Resist ASIC mining**: By using random code execution and memory-hard operations
- **Favor CPUs over GPUs**: Through complex branching and memory access patterns
- **Ensure fair mining**: By making specialized hardware ineffective

### Key Characteristics

1. **Memory-Hard**: Requires significant RAM (256MB in light mode, 2GB+ in fast mode)
2. **CPU-Intensive**: Uses a virtual machine that executes randomly generated programs
3. **Slow Initialization**: Cache generation takes 1-5 seconds
4. **Low Hashrate**: Intentionally slow (10-500 H/s vs 100K-1M+ H/s for SHA256)

## Implementation Details

### Current Implementation

This proof-of-concept uses a **RandomX-Lite simulation** (`/public/wasm/randomx.js`) that demonstrates the key characteristics of RandomX in both light and fast modes:

**Light Mode (Default):**
- ✅ 256MB memory scratchpad
- ✅ 2MB cache
- ✅ Slow initialization (2-5 seconds)
- ✅ Memory-hard hashing (scratchpad mixing)
- ✅ CPU-intensive operations (8 hash rounds)
- ✅ Realistic performance (~10-100 H/s)

**Fast Mode (Optional):**
- ✅ 2GB memory scratchpad
- ✅ 2GB dataset
- ✅ 2MB cache
- ✅ Slower initialization (10-30 seconds)
- ✅ Better hash performance (~100-500 H/s)
- ✅ Reduced VM rounds (4 instead of 8)
- ⚠️ Requires desktop browser with sufficient RAM

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Hash Worker                         │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │        RandomX Module                       │    │
│  │                                             │    │
│  │  ┌─────────────┐      ┌─────────────────┐ │    │
│  │  │   Cache     │      │   Scratchpad    │ │    │
│  │  │   (2MB)     │──────│   (256MB)       │ │    │
│  │  └─────────────┘      └─────────────────┘ │    │
│  │                                             │    │
│  │  Initialization:                            │    │
│  │  1. Allocate scratchpad                     │    │
│  │  2. Fill cache (Argon2d-like)              │    │
│  │  3. Derive scratchpad from cache           │    │
│  │                                             │    │
│  │  Hash Calculation:                          │    │
│  │  1. Mix with scratchpad (memory-hard)      │    │
│  │  2. Execute VM programs (CPU-intensive)    │    │
│  │  3. Repeat for 8 rounds                    │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### Memory Requirements

| Mode  | Cache | Scratchpad | Dataset | Total  | Browser Compatibility |
|-------|-------|------------|---------|--------|----------------------|
| Light | 2MB   | 256MB      | -       | 258MB  | ✅ Most browsers     |
| Fast  | 2MB   | 2GB        | 2GB     | 4GB+   | ⚠️ Desktop only      |

**Both modes are now implemented**. Default is Light mode for maximum browser compatibility. Fast mode can be enabled by passing `mode: 'fast'` in the worker configuration.

### Performance Characteristics

#### Expected Hashrates

| Device Type    | Threads | Light Mode H/s | Fast Mode H/s | SHA256 H/s (Previous) |
|----------------|---------|----------------|---------------|-----------------------|
| Mobile (2-4 core) | 2-4  | 5-20           | N/A (OOM)     | 10K-100K              |
| Laptop (4-8 core) | 4-8  | 20-100         | 100-300       | 50K-500K              |
| Desktop (8+ core) | 8    | 50-200         | 200-500       | 100K-1M+              |

**Note:** RandomX is intentionally ~1000-10000x slower than SHA256. This is by design.

#### Initialization Time

- **Light mode**: 2-5 seconds
- **Fast mode**: 10-30 seconds

## Worker Protocol

### Messages to Worker

```javascript
// Initialize worker with RandomX (Light mode - default)
{ type: 'INIT', data: { workerId: 0 } }

// Initialize worker with RandomX (Fast mode)
{ type: 'INIT', data: { workerId: 0, mode: 'fast' } }

// Start hashing
{ type: 'START', data: { config: { throttle: 30, statsInterval: 1000 } } }

// Stop hashing
{ type: 'STOP' }

// Cleanup memory
{ type: 'DESTROY' }
```

### Messages from Worker

```javascript
// Initialization progress
{ 
  type: 'INIT_PROGRESS', 
  workerId: 0,
  progress: 50,
  message: 'Filling scratchpad...'
}

// Ready to start
{ 
  type: 'READY',
  workerId: 0,
  capabilities: {
    randomx: true,
    wasmSupport: true,
    mode: 'light',
    memoryMB: 258
  }
}

// Statistics update
{
  type: 'STATS',
  workerId: 0,
  totalHashes: 150,
  hashrate: 25.5,
  dutyCycle: 70,
  memoryUsageMB: 258
}
```

## Usage Examples

### Using Light Mode (Default)

```javascript
// In coordinator configuration
const config = {
  threads: 4,
  throttle: 30,
  duration: 60,
  statsInterval: 1000,
  mode: 'light' // or omit for default
};

const coordinator = new WorkerCoordinator(config);
await coordinator.initialize();
coordinator.start();
```

### Using Fast Mode (Desktop Only)

```javascript
// Check available memory first
const availableMemory = navigator.deviceMemory || 8; // GB estimate

if (availableMemory >= 8) {
  const config = {
    threads: 2, // Fewer threads due to memory requirements
    throttle: 30,
    duration: 60,
    statsInterval: 1000,
    mode: 'fast' // Enable fast mode
  };

  const coordinator = new WorkerCoordinator(config);
  await coordinator.initialize();
  coordinator.start();
} else {
  console.log('Insufficient memory for fast mode, using light mode');
}
```

### Memory Detection

```javascript
function selectOptimalMode() {
  const memory = navigator.deviceMemory || 4;
  const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
  
  if (isMobile) {
    return { mode: 'light', threads: 1 };
  } else if (memory >= 8) {
    return { mode: 'fast', threads: 2 };
  } else {
    return { mode: 'light', threads: 4 };
  }
}

const { mode, threads } = selectOptimalMode();
```

## Browser Considerations

### Memory Limitations

1. **Per-Tab Limits**: Most browsers limit single-tab memory to 2-4GB
2. **Mobile Limits**: Mobile browsers may limit to 256-512MB
3. **Multiple Workers**: 
   - Light mode: 258MB × N threads
   - Fast mode: 4GB × N threads (recommend max 1-2 threads)

**Recommendation**: 
- Light mode: 1-2 threads on mobile, 2-8 threads on desktop
- Fast mode: 1-2 threads on desktop only (8GB+ RAM recommended)

### Performance Factors

1. **Background Throttling**: Hidden tabs run 10-100x slower
2. **Thermal Throttling**: CPU may slow down when hot (undetectable)
3. **Battery Saver**: Reduced performance on battery power
4. **Memory Pressure**: Browser may kill tabs if system RAM is low

### Best Practices

✅ **Do:**
- Start with light mode and 1-2 threads to test
- Monitor device temperature
- Run on AC power for extended benchmarks
- Use light mode on mobile and laptops
- Use fast mode only on desktop with 8GB+ RAM
- Expect significantly lower hashrates than SHA256

❌ **Don't:**
- Run fast mode on mobile devices (will cause out-of-memory errors)
- Use more than 2 threads in fast mode
- Run 8+ threads on mobile devices
- Expect GPU-like performance
- Run extended tests on battery
- Compare hashrates directly with SHA256

## Comparison with Real RandomX

### This Implementation

**Light Mode:**
- ✅ 256MB scratchpad memory-hard characteristics
- ✅ Realistic initialization time (2-5 seconds)
- ✅ Realistic performance profile (10-200 H/s)
- ✅ Browser-compatible
- ✅ Educational proof-of-concept

**Fast Mode:**
- ✅ 2GB scratchpad + 2GB dataset (4GB total)
- ✅ Slower initialization (10-30 seconds)
- ✅ Better performance (100-500 H/s)
- ✅ Reduced VM rounds for efficiency
- ✅ Desktop-only compatibility

### Real RandomX

- Uses AES instructions (hardware acceleration)
- Actual VM with SuperscalarHash
- Argon2d for cache generation
- Blake2b for various operations
- Optimized assembly code

### For Production Use

To replace this simulation with real RandomX:

1. **Option 1: C++ with Emscripten**
   ```bash
   git clone https://github.com/tevador/RandomX
   cd RandomX
   emcc -O3 -s WASM=1 \
     -s EXPORTED_FUNCTIONS='["_randomx_init", "_randomx_hash"]' \
     -s INITIAL_MEMORY=268435456 \
     -o randomx.js src/*.cpp
   ```

2. **Option 2: Rust with wasm-bindgen**
   ```toml
   [dependencies]
   randomx-rs = "1.0"
   wasm-bindgen = "0.2"
   ```

3. **Integration**: Replace `/public/wasm/randomx.js` with compiled output

## Security & Ethics

### Intended Use

✅ Educational demonstrations  
✅ Performance testing  
✅ Understanding browser mining  
✅ Benchmarking devices

### NOT Intended For

❌ Production cryptocurrency mining  
❌ Unauthorized background mining  
❌ Covert resource usage  
❌ Profit-generating mining operations

### Transparency Requirements

- Explicit user consent required
- Clear resource usage indicators
- Easy stop mechanism
- Open source and auditable
- No stealth operation

## Performance Optimization Tips

### For Better Hashrates

1. **Reduce Throttle**: Lower throttle percentage for more CPU usage
2. **Thread Count**: Use optimal thread count for your CPU (usually 50-75% of cores)
3. **Power Settings**: Ensure "High Performance" power plan on desktop
4. **Close Other Apps**: Minimize background processes
5. **Cooling**: Ensure adequate cooling to prevent thermal throttling

### Memory Optimization

1. **Light Mode Only**: Don't attempt fast mode in browsers
2. **Limit Threads**: Each thread multiplies memory usage
3. **Monitor Usage**: Watch browser DevTools memory profiler
4. **Cleanup**: Call `DESTROY` message when stopping to release memory

## Troubleshooting

### Slow Initialization

**Symptom**: Worker takes > 10 seconds to initialize  
**Causes**:
- Low-end device
- Memory pressure
- Background throttling

**Solutions**:
- Close other tabs/applications
- Use fewer threads
- Ensure tab is visible during init

### Low Hashrate

**Symptom**: < 1 H/s per thread  
**Causes**:
- High throttle setting
- Background tab throttling
- Thermal throttling
- Battery saver mode

**Solutions**:
- Reduce throttle to 0-30%
- Keep tab visible
- Run on AC power
- Improve cooling

### Out of Memory Errors

**Symptom**: Worker fails to initialize  
**Causes**:
- Too many threads
- Insufficient system RAM
- Mobile browser limits

**Solutions**:
- Reduce thread count to 1-2
- Close other tabs
- Use desktop browser

## Future Enhancements

Potential improvements:

- [ ] Real RandomX WASM compilation
- [ ] Fast mode support (with memory checks)
- [ ] Shared dataset between workers (using SharedArrayBuffer)
- [ ] Hardware capability detection
- [ ] Adaptive thread/memory management
- [ ] Pool mining integration (educational only)

## References

- [RandomX Specification](https://github.com/tevador/RandomX/blob/master/doc/specs.md)
- [RandomX Design](https://github.com/tevador/RandomX/blob/master/doc/design.md)
- [Monero RandomX Audit](https://www.getmonero.org/2019/11/01/randomx-audit.html)
- [WebAssembly Memory Limits](https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Memory)

## License

This implementation is for educational purposes. The actual RandomX algorithm is developed by tevador and contributors under BSD-3-Clause license.
