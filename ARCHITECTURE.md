# Technical Architecture

## Overview

This application demonstrates browser-based Monero (XMR) mining using the RandomX proof-of-work algorithm with a coordinator-worker pattern for parallel computing.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Main Thread                          │ │
│  │                                                          │ │
│  │  ┌──────────────┐        ┌──────────────────────┐      │ │
│  │  │   React UI   │◄──────►│ WorkerCoordinator    │      │ │
│  │  │              │        │                       │      │ │
│  │  │ - Consent    │        │ - Worker Management  │      │ │
│  │  │ - Controls   │        │ - Stats Aggregation  │      │ │
│  │  │ - Metrics    │        │ - Lifecycle Control  │      │ │
│  │  │ - Export     │        │ - Telemetry          │      │ │
│  │  └──────────────┘        └───────┬──────────────┘      │ │
│  │                                  │                      │ │
│  └──────────────────────────────────┼──────────────────────┘ │
│                                     │                        │
│                          postMessage│                        │
│                                     ▼                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Web Workers                          ││
│  │                                                          ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐││
│  │  │ Worker 0 │  │ Worker 1 │  │ Worker 2 │  │ Worker N │││
│  │  │          │  │          │  │          │  │          │││
│  │  │ RandomX  │  │ RandomX  │  │ RandomX  │  │ RandomX  │││
│  │  │ Module   │  │ Module   │  │ Module   │  │ Module   │││
│  │  │ (258MB)  │  │ (258MB)  │  │ (258MB)  │  │ (258MB)  │││
│  │  │          │  │          │  │          │  │          │││
│  │  │ Throttle │  │ Throttle │  │ Throttle │  │ Throttle │││
│  │  │ Loop     │  │ Loop     │  │ Loop     │  │ Loop     │││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

## Components

### 1. WorkerCoordinator (`/src/lib/coordinator.ts`)

**Responsibilities:**
- Worker pool lifecycle management
- Message routing and handling
- Statistics aggregation
- Duration enforcement
- Telemetry callbacks

**Key Methods:**
```typescript
async initialize(): Promise<void>
  // Spawns workers and waits for READY messages

start(): void
  // Broadcasts START, begins stats collection, sets duration timer

stop(): void
  // Sends STOP to all workers, finalizes stats

terminate(): void
  // Terminates all worker threads

updateThrottle(throttle: number): void
  // Updates throttle setting (applied on next work cycle)

getAggregatedStats(): AggregatedStats
  // Returns current statistics across all workers
```

**Internal State:**
- `workers: WorkerInfo[]` - Pool of worker metadata
- `timeSeriesData` - Rolling window of performance samples
- `startTime` - Benchmark start timestamp
- `config` - Current benchmark configuration

### 2. Hash Worker (`/public/hash-worker.js`)

**Responsibilities:**
- RandomX module initialization
- Memory scratchpad management (256MB light mode)
- RandomX hash computation
- Duty-cycle throttling implementation
- Statistics reporting
- Memory usage tracking
- Graceful shutdown and cleanup

**Message Protocol:**

**Incoming:**
```javascript
{ type: 'INIT', data: { workerId: number } }
{ type: 'START', data: { config: { throttle, statsInterval } } }
{ type: 'STOP' }
{ type: 'UPDATE_CONFIG', data: { throttle } }
{ type: 'DESTROY' }
```

**Outgoing:**
```javascript
{ type: 'INIT_PROGRESS', workerId, progress, message, memoryInfo }
{ type: 'READY', workerId, capabilities: { randomx, wasmSupport, mode, memoryMB } }
{ type: 'STATS', workerId, hashesDelta, elapsedMs, totalHashes, hashrate, dutyCycle, memoryUsageMB }
{ type: 'ERROR', workerId, error, details }
{ type: 'STOPPED', workerId, totalHashes }
{ type: 'DESTROYED', workerId }
```

**RandomX Initialization Flow:**
```javascript
async function initializeRandomX() {
  // 1. Create RandomX module instance
  randomxModule = new RandomXModule()
  
  // 2. Allocate 256MB scratchpad + 2MB cache
  // Report: INIT_PROGRESS (0%, "Allocating memory...")
  
  // 3. Initialize cache with seed
  await randomxModule.init(seed)
  
  // 4. Fill scratchpad from cache
  // Report: INIT_PROGRESS (50%, "Filling scratchpad...")
  
  // 5. Complete initialization
  // Report: INIT_PROGRESS (100%, "RandomX initialized")
  
  // 6. Send READY message with capabilities
}
```

**Hashing Loop:**
```javascript
while (running) {
  // Work phase
  for (workMs duration) {
    // Calculate RandomX hash (slow, memory-intensive)
    await randomxHash(randomInput)
    totalHashes++
  }
  
  // Stats reporting (includes memory usage)
  if (statsInterval elapsed) {
    postMessage({ 
      type: 'STATS',
      memoryUsageMB: randomxModule.getMemoryInfo().totalMB,
      ...
    })
  }
  
  // Sleep phase (throttling)
  sleep(sleepMs)
}
```

### 3. RandomX Module (`/public/wasm/randomx.js`)

**Responsibilities:**
- Memory scratchpad allocation (256MB)
- Cache generation and initialization
- Scratchpad filling and mixing
- Hash calculation with VM simulation
- Memory management and cleanup

**Key Components:**

1. **Memory Scratchpad** (256MB)
   - Random-access memory buffer
   - Mixed during each hash operation
   - Provides memory-hardness

2. **Cache** (2MB)
   - Initialized from seed using SHA-256
   - Used to derive scratchpad contents
   - Simulates Argon2d behavior

3. **Hash Calculation**
   - 8 rounds of VM execution simulation
   - Scratchpad mixing (memory-hard)
   - Multiple SHA-256 operations (CPU-intensive)
   - Returns 32-byte hash

**API:**
```javascript
class RandomXModule {
  async init(seedKey)                    // Initialize with seed
  async calculateHash(input)             // Calculate hash
  getMemoryInfo()                        // Get memory usage stats
  destroy()                              // Release memory
}
```

### 3. React UI Components

#### ConsentGate
- Displays consent checkbox
- Shows resource usage warnings
- Controls access to benchmark features

#### ControlPanel
- Thread count slider (1-8, capped at hardwareConcurrency)
- Throttle slider (0-90%)
- Duration selector
- Start/Stop buttons

#### TelemetryDashboard
- Real-time metric cards
- Worker status grid
- Hashrate visualization
- Performance indicators

#### ReportExport
- Results summary
- JSON export functionality
- Device/config metadata display

#### EducationalPanel
- Collapsible information sections
- Technical explanations
- Safety guidelines
- Use case examples

## Data Flow

### Initialization Flow
```
User checks consent
  ↓
User clicks Start
  ↓
Coordinator.initialize()
  ↓
Spawn N workers
  ↓
Send INIT to each
  ↓
Workers load, send READY
  ↓
All READY → Coordinator.start()
  ↓
Send START to all workers
  ↓
Workers begin hashing loop
```

### Statistics Flow
```
Worker completes batch
  ↓
Check if statsInterval elapsed
  ↓
Calculate hashrate
  ↓
postMessage({ type: 'STATS', ... })
  ↓
Coordinator receives message
  ↓
Update worker's stats
  ↓
Aggregate across all workers
  ↓
Invoke onStatsUpdate callback
  ↓
React re-renders with new stats
```

### Shutdown Flow
```
User clicks Stop OR duration expires
  ↓
Coordinator.stop()
  ↓
Send STOP to all workers
  ↓
Workers set running = false
  ↓
Workers send STOPPED message
  ↓
Coordinator collects final stats
  ↓
Generate BenchmarkReport
  ↓
Coordinator.terminate()
  ↓
Worker.terminate() on each
```

## Throttling Algorithm

**Duty Cycle Implementation:**

```javascript
const workMs = Math.max(1, 100 - throttle)
const sleepMs = Math.max(1, throttle)

// Example: 30% throttle
// workMs = 100 - 30 = 70ms
// sleepMs = 30ms
// Duty cycle: 70% work, 30% idle
```

**Effect on Hashrate:**
- 0% throttle: ~100% CPU utilization, maximum hashrate
- 30% throttle: ~70% CPU utilization, ~70% of max hashrate
- 90% throttle: ~10% CPU utilization, ~10% of max hashrate

**Implementation:**
1. Compute hashes for `workMs` duration
2. Sleep for `sleepMs` duration
3. Repeat cycle
4. Report actual duty cycle in stats

## Performance Characteristics

### Hashrate Calculation

**Per-Worker Hashrate:**
```typescript
hashrate = hashesSinceLastStats / elapsedSeconds
```

**Aggregated Hashrate:**
```typescript
currentHashrate = sum(worker.lastHashrate for all running workers)
```

**Average Hashrate:**
```typescript
avgHashrate = mean(timeSeriesData.map(d => d.hashrate))
```

### Time Series Data

Collected every 500ms:
```typescript
{
  timestamp: performance.now() - startTime,  // ms since start
  hashrate: current aggregate hashrate,
  totalHashes: cumulative hash count
}
```

Stored with 600-sample rolling window (~5 minutes at 500ms intervals)

### Browser Constraints Impact

| Constraint | Effect on Performance |
|------------|----------------------|
| Hidden tab | 10-100x reduction (browser-dependent) |
| Battery saver | 20-50% reduction |
| Thermal throttling | Variable, progressive reduction |
| Background processes | 5-30% reduction |
| Memory pressure | Potential worker failures |

## Security Model

### Sandboxing
- Workers run in isolated contexts
- No access to DOM
- No access to localStorage
- No network capabilities (after script load)
- No file system access

### Content Security Policy Compatible
```
script-src 'self';
worker-src 'self';
```

### No Shared Memory Required
- Does not require SharedArrayBuffer
- No need for cross-origin isolation headers
- Falls back gracefully without COOP/COEP

## Error Handling

### Worker Initialization Errors
```typescript
try {
  const worker = new Worker('/hash-worker.js')
  // ... initialization
} catch (error) {
  workerInfo.state = 'error'
  workerInfo.error = error.message
  // Continue with remaining workers
}
```

### Runtime Errors
- Caught in worker's global error handler
- Sent via ERROR message
- Logged but non-fatal
- Worker marked as errored state
- Other workers continue

### Graceful Degradation
- If some workers fail, others continue
- Minimum 1 working worker required
- Clear error messages to user
- Automatic cleanup on failures

## Memory Management

### Worker Memory
Each worker allocates:
- ~2-4MB base overhead
- Minimal incremental per hash
- Auto-collected by browser on terminate

### Main Thread Memory
- Worker metadata: ~1KB per worker
- Time series: ~10KB per 600 samples
- Total: <100KB for full session

### No Memory Leaks
- Workers terminated on stop
- Event listeners cleaned up
- Intervals/timeouts cleared
- References nulled after terminate

## Performance Optimization

### Worker Pool Sizing
- Default: 1 thread
- Maximum: min(hardwareConcurrency, 8)
- Recommended: 25-50% of available cores for desktop
- Recommended: 1-2 for mobile

### Hash Batching
- Compute multiple hashes before checking time
- Reduces overhead of time checks
- Balance: more hashes = less responsive stop

### Stats Reporting
- Default interval: 1000ms
- Trade-off: frequency vs overhead
- Aggregation done on main thread

### Crypto API Usage
```javascript
await crypto.subtle.digest('SHA-256', dataBuffer)
```
- Uses browser's optimized implementation
- Hardware-accelerated where available
- Async to prevent blocking

## Browser Compatibility

### Requirements
- Web Workers support (all modern browsers)
- Web Crypto API (all modern browsers since ~2017)
- ES6+ JavaScript support
- Performance API

### Tested Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (with limitations)

### Known Issues
- Safari may throttle more aggressively
- Mobile browsers limit thread count
- Some browsers limit worker count
- Background throttling varies significantly

## Extensibility

### Adding Custom Hash Functions
Replace in worker:
```javascript
async function customHash(data) {
  // Your hashing implementation
  return result
}
```

### Different Work Patterns
Modify worker loop to:
- Test different algorithms
- Benchmark different operations
- Compare performance characteristics

### Additional Telemetry
Extend stats messages with:
- Memory usage (where available)
- Detailed timing breakdowns
- Per-operation metrics

## Testing Strategy

### Unit Tests
- Coordinator worker lifecycle
- Stats aggregation logic
- Throttle calculations
- Time series management

### Integration Tests
- Full benchmark flow
- Error handling paths
- Configuration changes
- Report generation

### Manual Testing
- Different thread counts
- Various throttle settings
- Different browsers
- Mobile devices
- Long-duration runs

## Debugging

### Enable Verbose Logging
Add to worker:
```javascript
const DEBUG = true
if (DEBUG) console.log('[Worker ${workerId}]', message)
```

### Monitor Worker Health
Check coordinator:
```typescript
coordinator.getWorkerInfo() // State of each worker
```

### Performance Profiling
Use browser DevTools:
- Performance tab: CPU usage
- Memory tab: Heap snapshots
- Network tab: Verify no requests after load

## Future Enhancements

Potential improvements:
- Visual hashrate chart (line graph)
- Historical benchmark comparison
- Hardware capability detection
- Adaptive throttling based on temperature proxies
- WebAssembly implementation for better performance
- SharedArrayBuffer optimization (when available)
- Progressive Web App for offline use

---

**Note:** This architecture prioritizes transparency, educational value, and user control over raw performance.
