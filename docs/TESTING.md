# WebGPU Implementation Testing Checklist

This document provides a comprehensive manual testing checklist for the WebGPU backend implementation in the Web XMR Miner POC.

## Screenshots

For visual reference of the expected UI states, see the [Screenshots section in the README](../README.md#screenshots). Key screenshots include:
- Backend selector dropdown showing WASM and WebGPU options
- WebGPU backend selected in the control panel
- UI overview with all controls and telemetry dashboard

## Prerequisites

- Modern browser with WebGPU support (Chrome 113+, Edge 113+)
- Browser without WebGPU support for fallback testing (Firefox, Safari)
- Developer console open for debugging

## Automated Tests

Before manual testing, run the automated test suite:

```bash
# Run all tests
npm test

# Run WebGPU-specific tests only
npm run test:webgpu

# Run tests with UI
npm run test:ui
```

All automated tests should pass before proceeding with manual testing.

---

## Manual Testing Checklist

### 1. WebGPU Initialization

#### Test 1.1: WebGPU Available - Chrome/Edge
- [ ] Open the application in Chrome or Edge (version 113+)
- [ ] Open browser DevTools (F12) and go to Console tab
- [ ] Look for message: "WebGPU is available"
- [ ] Select "WebGPU (GPU)" from the backend dropdown in Control Panel
- [ ] Click "Start Benchmark"
- [ ] Verify initialization progress messages appear in console:
  - [ ] "Worker 0: [WebGPU] Starting WebGPU initialization..."
  - [ ] "Worker 0: [WebGPU] Requesting WebGPU adapter..."
  - [ ] "Worker 0: [WebGPU] Requesting WebGPU device..."
  - [ ] "Worker 0: [WebGPU] Allocating GPU scratchpad buffer..."
  - [ ] "Worker 0: [WebGPU] RandomX WebGPU light mode initialized"
- [ ] Verify benchmark starts successfully
- [ ] Verify hashrate is displayed in Telemetry Dashboard
- [ ] Verify hash count increases over time

**Expected Result**: WebGPU initializes successfully and benchmark runs

#### Test 1.2: WebGPU Initialization Progress
- [ ] Start a new benchmark with WebGPU backend
- [ ] Watch for initialization progress (0-100%) in console logs
- [ ] Verify progress increases incrementally
- [ ] Verify final message indicates "100%" completion

**Expected Result**: Clear progress feedback during initialization

### 2. WASM Fallback

#### Test 2.1: Browser Without WebGPU Support
- [ ] Open the application in Firefox or Safari
- [ ] Open browser DevTools Console
- [ ] Look for message: "WebGPU not supported - WASM backend only"
- [ ] Verify WebGPU option is still available in dropdown (it's educational)
- [ ] Try selecting "WebGPU (GPU)" backend
- [ ] Click "Start Benchmark"
- [ ] Verify error message appears (WebGPU not supported)
- [ ] Switch back to "WASM (CPU)" backend
- [ ] Click "Start Benchmark"
- [ ] Verify WASM backend works correctly

**Expected Result**: Graceful fallback to WASM when WebGPU unavailable

#### Test 2.2: WebGPU Initialization Failure
- [ ] In a WebGPU-capable browser, open DevTools
- [ ] If possible, disable WebGPU (chrome://flags or developer settings)
- [ ] Try to start benchmark with WebGPU backend
- [ ] Verify error message is user-friendly
- [ ] Verify app doesn't crash
- [ ] Verify you can switch to WASM backend
- [ ] Verify WASM backend works after WebGPU failure

**Expected Result**: App handles WebGPU failure gracefully

### 3. UI Backend Selection

> **Visual Reference**: See [screenshots/webgpu-backend-selector-dropdown.png](screenshots/webgpu-backend-selector-dropdown.png) and [screenshots/webgpu-backend-selected-ui.png](screenshots/webgpu-backend-selected-ui.png) for expected UI appearance.

#### Test 3.1: Backend Dropdown Visibility
- [ ] Verify "Compute Backend" label is visible in Control Panel
- [ ] Verify dropdown shows current selection
- [ ] Click on dropdown
- [ ] Verify two options are visible:
  - [ ] "WASM (CPU)"
  - [ ] "WebGPU (GPU) - Educational"
- [ ] Compare UI with reference screenshot: `screenshots/webgpu-backend-selector-dropdown.png`

**Expected Result**: Both backend options are clearly presented

#### Test 3.2: Educational Note Display
- [ ] Locate the educational note below the backend dropdown
- [ ] Verify text reads: "WebGPU demonstrates why RandomX favors CPUs - expect lower performance."
- [ ] Verify text is clearly visible and readable

**Expected Result**: Users are informed about expected GPU performance

#### Test 3.3: Backend Selection - WASM
- [ ] Ensure benchmark is NOT running
- [ ] Select "WASM (CPU)" from dropdown
- [ ] Verify selection changes
- [ ] Click "Start Benchmark"
- [ ] Verify worker uses `/hash-worker.js` (check Network tab)
- [ ] Verify benchmark runs successfully

**Expected Result**: WASM backend loads correct worker file

#### Test 3.4: Backend Selection - WebGPU
- [ ] Ensure benchmark is NOT running
- [ ] Select "WebGPU (GPU)" from dropdown
- [ ] Verify selection changes
- [ ] Click "Start Benchmark"
- [ ] Verify worker uses `/hash-worker-webgpu.js` (check Network tab)
- [ ] Verify benchmark runs successfully (in WebGPU-capable browser)

**Expected Result**: WebGPU backend loads correct worker file

#### Test 3.5: Dropdown Disabled During Benchmark
- [ ] Start a benchmark (any backend)
- [ ] Try to click on backend dropdown
- [ ] Verify dropdown is disabled/grayed out
- [ ] Stop the benchmark
- [ ] Verify dropdown becomes enabled again

**Expected Result**: Backend cannot be changed while benchmark is running

#### Test 3.6: Dropdown Disabled When Not Consented
- [ ] If consent gate is visible, ensure you have NOT consented
- [ ] Verify backend dropdown is disabled
- [ ] Verify all other controls are disabled
- [ ] Click "I Understand and Consent"
- [ ] Verify backend dropdown becomes enabled

**Expected Result**: Controls are disabled until user consents

### 4. Hash Validation

#### Test 4.1: WASM Backend Hash Output
- [ ] Select "WASM (CPU)" backend
- [ ] Start benchmark
- [ ] Open Network tab in DevTools
- [ ] Monitor worker messages (if possible with debugging)
- [ ] Verify hashes are being calculated
- [ ] Verify hash count increases in Telemetry Dashboard
- [ ] Stop benchmark
- [ ] Verify total hash count is greater than 0

**Expected Result**: WASM produces valid hash outputs

#### Test 4.2: WebGPU Backend Hash Output
- [ ] In WebGPU-capable browser, select "WebGPU (GPU)" backend
- [ ] Start benchmark
- [ ] Monitor console for any hash-related errors
- [ ] Verify hash count increases in Telemetry Dashboard
- [ ] Verify hashrate is displayed (even if lower than WASM)
- [ ] Stop benchmark
- [ ] Verify total hash count is greater than 0

**Expected Result**: WebGPU produces valid hash outputs

#### Test 4.3: Performance Comparison
- [ ] Run benchmark with WASM backend for 1 minute
- [ ] Note the average hashrate (H/s)
- [ ] Stop and reset
- [ ] Run benchmark with WebGPU backend for 1 minute (in capable browser)
- [ ] Note the average hashrate (H/s)
- [ ] Compare results

**Expected Result**: WebGPU shows LOWER performance than WASM (this is expected and educational)

#### Test 4.4: Telemetry Dashboard Display
- [ ] Start benchmark with either backend
- [ ] Verify "Telemetry Dashboard" shows:
  - [ ] Current hashrate (H/s)
  - [ ] Total hashes calculated
  - [ ] Peak hashrate
  - [ ] Average hashrate
  - [ ] Running workers count
  - [ ] Elapsed time
- [ ] Verify numbers update in real-time

**Expected Result**: Dashboard displays metrics for both backends

### 5. Error Handling

#### Test 5.1: WebGPU Initialization Error Message
- [ ] In browser without WebGPU, select WebGPU backend
- [ ] Start benchmark
- [ ] Verify error toast/message appears
- [ ] Verify message mentions "WebGPU not supported" or similar
- [ ] Verify message suggests using WASM backend

**Expected Result**: Clear, user-friendly error message

#### Test 5.2: App Stability After Error
- [ ] Trigger a WebGPU error (as above)
- [ ] Verify app doesn't crash or freeze
- [ ] Verify you can interact with other controls
- [ ] Verify you can switch backends
- [ ] Verify you can start a new benchmark with WASM

**Expected Result**: App remains stable after errors

#### Test 5.3: Worker Error Recovery
- [ ] Start benchmark with multiple threads (e.g., 4)
- [ ] If one worker fails to initialize, verify:
  - [ ] Warning message appears indicating worker failure count
  - [ ] Other workers continue to function
  - [ ] Benchmark continues with remaining workers
  - [ ] Stats update correctly

**Expected Result**: Partial worker failure doesn't stop entire benchmark

#### Test 5.4: Switch Backend After Error
- [ ] Cause WebGPU initialization error
- [ ] Without refreshing page, switch to WASM backend
- [ ] Start benchmark
- [ ] Verify WASM works correctly
- [ ] Switch back to WebGPU
- [ ] Verify error occurs again (in non-supporting browser)

**Expected Result**: Can switch between backends after errors

### 6. Multi-Threading Tests

#### Test 6.1: Multiple Workers - WASM
- [ ] Select WASM backend
- [ ] Set worker threads to 4
- [ ] Start benchmark
- [ ] Verify all 4 workers initialize
- [ ] Verify "Running workers" count shows 4
- [ ] Verify combined hashrate from all workers

**Expected Result**: Multiple WASM workers function correctly

#### Test 6.2: Multiple Workers - WebGPU
- [ ] In WebGPU-capable browser, select WebGPU backend
- [ ] Set worker threads to 4
- [ ] Start benchmark
- [ ] Verify all 4 workers attempt initialization
- [ ] Verify workers that initialize successfully contribute to hashrate
- [ ] Monitor console for initialization messages from each worker

**Expected Result**: Multiple WebGPU workers can initialize

### 7. Integration Tests

#### Test 7.1: Full Workflow - WASM
- [ ] Open app in any browser
- [ ] Consent to benchmark
- [ ] Select WASM backend
- [ ] Set threads to 2
- [ ] Set throttle to 30%
- [ ] Set duration to 15 seconds
- [ ] Start benchmark
- [ ] Verify benchmark runs
- [ ] Wait for automatic completion
- [ ] Verify completion message
- [ ] Verify report is generated
- [ ] Export report (JSON download)
- [ ] Verify report contains correct backend info

**Expected Result**: Complete WASM workflow works end-to-end

#### Test 7.2: Full Workflow - WebGPU
- [ ] Open app in Chrome/Edge
- [ ] Consent to benchmark
- [ ] Select WebGPU backend
- [ ] Set threads to 2
- [ ] Set throttle to 30%
- [ ] Set duration to 15 seconds
- [ ] Start benchmark
- [ ] Verify initialization progress messages
- [ ] Verify benchmark runs
- [ ] Wait for automatic completion
- [ ] Verify completion message
- [ ] Verify report is generated
- [ ] Export report (JSON download)
- [ ] Verify report contains backend: "webgpu"

**Expected Result**: Complete WebGPU workflow works end-to-end

#### Test 7.3: Stop and Restart
- [ ] Start benchmark with any backend
- [ ] Let it run for 5 seconds
- [ ] Click "Stop Benchmark"
- [ ] Verify benchmark stops
- [ ] Verify stats are frozen
- [ ] Start a new benchmark (same or different backend)
- [ ] Verify new benchmark starts fresh

**Expected Result**: Can stop and restart benchmarks

### 8. Cross-Browser Compatibility

#### Test 8.1: Chrome/Edge (WebGPU Supported)
- [ ] Test all features in Chrome
- [ ] Test all features in Edge
- [ ] Verify WebGPU backend works
- [ ] Verify WASM backend works

**Expected Result**: Full functionality in Chrome/Edge

#### Test 8.2: Firefox (No WebGPU)
- [ ] Test WASM backend works
- [ ] Verify appropriate messages about WebGPU unavailability
- [ ] Verify app doesn't crash

**Expected Result**: WASM works, WebGPU shows helpful errors

#### Test 8.3: Safari (No WebGPU)
- [ ] Test WASM backend works
- [ ] Verify appropriate messages about WebGPU unavailability
- [ ] Verify app doesn't crash

**Expected Result**: WASM works, WebGPU shows helpful errors

---

## Test Results Summary

After completing all tests, document your findings:

### Working Features
- List all features that work as expected

### Issues Found
- Document any bugs, UI issues, or unexpected behavior
- Include browser/OS information
- Include steps to reproduce

### Performance Notes
- WASM hashrate: ______ H/s
- WebGPU hashrate: ______ H/s (should be lower)
- Notes on performance differences

### Browser Compatibility
- Chrome/Edge: ✓/✗
- Firefox: ✓/✗
- Safari: ✓/✗

---

## Debugging Tips

### Enable Verbose Logging
Open browser console and monitor for:
- Worker initialization messages
- WebGPU adapter/device requests
- Error messages
- Progress updates

### Network Tab
Check which worker files are loaded:
- `/hash-worker.js` for WASM
- `/hash-worker-webgpu.js` for WebGPU

### Performance Tab
Monitor CPU/GPU usage during benchmarks

### Common Issues

**WebGPU not found in supported browser:**
- Ensure browser is up to date (Chrome/Edge 113+)
- Check chrome://gpu for WebGPU status
- Try enabling WebGPU in chrome://flags if needed

**High error rate:**
- Reduce thread count
- Increase throttle
- Check available system resources

**Benchmark doesn't start:**
- Ensure consent is given
- Check console for errors
- Verify worker files are accessible
- Check for browser compatibility

---

## Sign-off

Once all tests pass:

- [ ] All automated tests pass
- [ ] All critical manual tests pass
- [ ] Cross-browser testing complete
- [ ] Documentation is accurate
- [ ] Known issues are documented

**Tester Name:** ________________

**Date:** ________________

**Browser Tested:** ________________

**Notes:** ________________
