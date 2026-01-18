# Web XMR Miner POC

An educational web application that demonstrates browser-based Monero (XMR) mining using the RandomX proof-of-work algorithm with Web Workers for parallel computing.

## What This Is

This is an **educational proof-of-concept** that shows:
- How browsers can perform parallel computing using Web Workers
- RandomX algorithm characteristics (memory-hard, CPU-optimized)
- Real-time performance telemetry and monitoring
- CPU resource management through throttling
- Browser computing constraints and limitations
- Reproducible performance benchmarking across devices

## What This Is NOT

❌ **Not a production cryptocurrency miner** - Uses RandomX simulation for educational purposes only  
❌ **Not profitable** - Browser-based mining is inefficient compared to dedicated hardware  
❌ **Not stealth** - Requires explicit user consent before starting  
❌ **Not production mining software** - This is a learning tool, not a turnkey mining solution  

## Key Features

### ✅ Explicit Consent Required
- No execution without user acknowledgment
- Clear warnings about resource usage
- Disabled controls until consent is given

### 🎛️ Full User Control
- Configurable worker threads (1-8)
- CPU throttle control (0-90%)
- Duration presets (15s, 60s, 5min)
- Immediate Stop button

### 📊 Real-Time Telemetry
- Current hashrate (H/s)
- Total hashes computed
- Peak and average hashrate
- Per-worker status monitoring
- Elapsed time tracking
- **Solutions found** (demonstrates difficulty checking)
- **Cache reinitializations** (shows realistic mining interruptions)

### 📈 Benchmark Export
- Download comprehensive JSON reports
- Device and browser information
- Time-series performance data
- Reproducible results for comparison

### 📚 Educational Content
- Explanations of Web Workers
- Browser constraint documentation
- Safety tips and best practices
- Use case examples

## How It Works

### Architecture

1. **Main Thread (Coordinator)**
   - Spawns and manages Web Worker pool
   - Aggregates performance statistics
   - Controls worker lifecycle

2. **Web Workers**
   - Initialize RandomX with 256MB memory scratchpad
   - Run RandomX hash computations in parallel
   - Implement duty-cycle throttling (work/sleep)
   - Report statistics at regular intervals

3. **RandomX Algorithm**
   - Memory-hard: Uses 256MB scratchpad (light mode)
   - CPU-intensive: Multiple hashing rounds with VM simulation
   - Initialization: 2-5 second cache setup
   - Performance: ~10-200 H/s (much slower than SHA256 by design)
   - **Realistic Mining Components:**
     - **Block Headers**: 76-byte Monero-style headers with binary serialization
     - **Sequential Nonce**: Workers iterate through partitioned nonce spaces
     - **Difficulty Checking**: Every hash compared against target (realistic overhead)
     - **Cache Reinitialization**: Periodic cache updates every 2 minutes (simulates blockchain height changes)

4. **Throttling System**
   - Work for X ms, sleep for Y ms based on throttle percentage
   - Example: 30% throttle = 70ms work, 30ms sleep per 100ms cycle

5. **Telemetry Aggregation**
   - Rolling window hashrate calculation
   - Per-worker health monitoring
   - Time-series data collection
   - Memory usage tracking
   - Solutions found tracking (demonstrates difficulty system)
   - Cache reinitialization monitoring (realistic mining interruptions)

## Browser Requirements

- Modern browser with Web Worker support (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Sufficient memory (at least 512MB free RAM per worker)
- Web Crypto API support (for SHA-256 operations within RandomX)

**Note:** Performance varies significantly by:
- Device CPU capabilities
- Available RAM
- Browser engine and version
- Battery/power state
- Thermal conditions
- Background processes

### RandomX-Specific Requirements

- **Memory**: Each worker requires ~258MB RAM (256MB scratchpad + 2MB cache)
- **Initialization**: Workers need 2-5 seconds to initialize before hashing begins
- **Performance**: Expect 10-200 H/s total (vs 100K-1M+ H/s with previous SHA256)

## Usage Guide

### Quick Start

1. **Read the consent panel** - Understand what the tool does
2. **Check the consent box** - Required to enable controls
3. **Configure settings:**
   - Start with 1-2 threads
   - Use 30% throttle initially
   - Select 15-60 second duration
4. **Click Start** - Watch real-time metrics
5. **Export results** - Download JSON report when complete

### Best Practices

✅ **Do:**
- Start with conservative settings (low threads, high throttle)
- Monitor device temperature
- Run on AC power for long benchmarks
- Close other applications for accurate results
- Compare results across different devices/browsers

❌ **Don't:**
- Run extended benchmarks on battery power
- Use maximum threads without testing first
- Ignore excessive heat warnings
- Run in hidden/background tabs (results will be throttled)

### Safety Tips

- **Watch for heat:** If device becomes uncomfortably warm, stop immediately
- **Battery drain:** Benchmarks consume significant power on mobile devices
- **Start small:** Test with short durations before extending
- **Background throttling:** Hidden tabs may reduce performance significantly

## Understanding Results

### Hashrate
- **Current:** Real-time hashes per second across all workers
- **Peak:** Maximum observed hashrate during session
- **Average:** Mean hashrate over entire benchmark duration

### Typical Performance Ranges

**RandomX (Current Implementation)**

| Device Type | Threads | Approx. Hashrate (H/s) | Memory Usage |
|-------------|---------|------------------------|--------------|
| Mobile | 1-2 | 5-20 | 258-516MB |
| Laptop | 2-4 | 20-100 | 516MB-1GB |
| Desktop | 4-8 | 50-200 | 1-2GB |

**Previous SHA256 Implementation** (for comparison)

| Device Type | Threads | Approx. Hashrate (H/s) |
|-------------|---------|------------------------|
| Mobile | 2-4 | 10K-100K |
| Laptop | 4-8 | 50K-500K |
| Desktop | 8 | 100K-1M+ |

*RandomX is intentionally ~1000-10000x slower than SHA256. This is by design to resist ASIC/GPU mining.*

## Browser Constraints

### Memory Limitations
- Each worker requires ~258MB RAM (RandomX light mode)
- Browsers restrict total memory allocation to prevent crashes
- Mobile devices may only support 1-2 workers due to memory limits
- Desktop browsers can typically handle 2-8 workers

### Initialization Overhead
- RandomX requires 2-5 seconds to initialize per worker
- Cache generation is CPU-intensive
- Workers cannot hash until initialization completes

### Background Throttling
- Hidden tabs are heavily throttled by browsers to save power
- Expect 10-100x performance reduction when tab is not visible

### No Direct Hardware Access
- Cannot read actual CPU temperature
- Cannot disable OS-level thermal throttling
- Cannot measure exact power consumption
- Cannot use hardware AES instructions (WASM limitation)

### Sandboxed Execution
- Workers run in isolated contexts for security
- Limited access to system resources
- No direct CPU instruction control

## Ethics & Responsible Use

### Transparency Commitment

This project is designed with radical transparency:
- Open source code
- Clear documentation
- No hidden behavior
- No auto-start mechanisms
- No data collection or transmission

### Consent-Driven Design

- Explicit opt-in required
- Visual warnings before execution
- Easy stop mechanism
- Clear resource usage indicators

### Educational Purpose

This tool exists to:
- Teach parallel computing concepts
- Demonstrate browser capabilities and limitations
- Enable reproducible performance testing
- Show responsible resource usage patterns

### What We DO NOT Support

🚫 Embedding this in third-party sites without consent  
🚫 Auto-starting computation without user action  
🚫 Hiding execution from users  
🚫 Using for actual cryptocurrency mining  
🚫 Bypassing browser security controls  

## Technical Implementation

### Stack
- **Frontend:** React + TypeScript
- **Workers:** Vanilla JavaScript Web Workers
- **Hashing:** RandomX-Lite simulation (memory-hard algorithm)
- **UI:** shadcn/ui + Tailwind CSS
- **Icons:** Phosphor Icons

### File Structure
```
/public
  /wasm
    randomx.js             # RandomX simulation module
  hash-worker.js           # Web Worker implementation
/src
  /components
    ConsentGate.tsx        # User consent UI
    ControlPanel.tsx       # Benchmark controls
    TelemetryDashboard.tsx # Live metrics
    ReportExport.tsx       # Result export
    EducationalPanel.tsx   # Information sections
  /lib
    coordinator.ts         # Worker management
    types.ts              # TypeScript interfaces
  App.tsx                 # Main application
```

### Worker Communication Protocol

**Messages to Worker:**
- `INIT {workerId}` - Initialize worker with RandomX
- `START {config}` - Begin hashing loop
- `STOP` - Terminate execution
- `UPDATE_CONFIG {throttle}` - Adjust throttling
- `DESTROY` - Cleanup and release memory

**Messages from Worker:**
- `INIT_PROGRESS {progress, message}` - Initialization status
- `READY {workerId, capabilities}` - Initialization complete (includes RandomX info)
- `STATS {hashrate, totalHashes, memoryUsageMB, ...}` - Performance update
- `ERROR {error, details}` - Error occurred
- `STOPPED {totalHashes}` - Execution stopped

## Benchmark Report Format

Exported JSON structure:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "config": {
    "threads": 4,
    "throttle": 30,
    "duration": 60
  },
  "deviceInfo": {
    "userAgent": "...",
    "hardwareConcurrency": 8,
    "memory": 8
  },
  "stats": {
    "totalHashes": 1250000,
    "currentHashrate": 20833,
    "peakHashrate": 25000,
    "avgHashrate": 20833,
    "elapsedTime": 60
  },
  "timeSeriesData": [...],
  "workerData": [...]
}
```

## Known Limitations

1. **Browser Variability:** Results differ significantly across browsers
2. **Thermal Throttling:** CPU may slow down during execution (undetectable)
3. **Background Throttling:** Hidden tabs run at reduced speed
4. **No GPU Acceleration:** Uses only CPU compute (as designed for RandomX)
5. **Overhead:** Worker coordination adds performance overhead
6. **Precision:** Hashrate measurements are estimates
7. **Memory Usage:** Each worker requires ~258MB RAM
8. **Initialization Time:** 2-5 seconds delay before hashing begins
9. **Simulation:** Uses RandomX-like algorithm, not official RandomX WASM

## Security Considerations

### Antivirus/Adblock
Some security software may flag this as:
- Cryptocurrency miner (it uses RandomX-like hashing)
- Resource-intensive script (it intentionally uses CPU and RAM)

This is a **false positive** - the code is:
- Open source and auditable
- Consent-gated
- Stops when requested
- Transparent about behavior

### Privacy
- **No tracking:** Zero analytics or telemetry sent to servers
- **Local only:** All computation happens in your browser
- **No cookies:** No persistent identifiers
- **No network requests:** After page load, runs entirely offline

## Related Documentation

- [RANDOMX.md](./RANDOMX.md) - Detailed RandomX implementation notes
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture documentation
- [ETHICS.md](./ETHICS.md) - Ethical considerations and responsible use

## Contributing

To submit benchmark results:
1. Run benchmark with your device
2. Export JSON report
3. Include in pull request with device description

To report issues:
- Browser and version
- Device specifications
- Steps to reproduce
- Error messages if applicable

## License

MIT License - See LICENSE file for details

## Acknowledgments

- RandomX algorithm by tevador and contributors
- Uses RandomX-Lite simulation for browser compatibility
- Built with React and TypeScript
- UI components from shadcn/ui
- Educational resource inspired by browser computing research and Monero's RandomX PoW

---

**Remember:** This is an educational tool. Use responsibly, start with conservative settings, and stop if your device becomes too warm.
