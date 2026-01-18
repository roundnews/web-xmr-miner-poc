# Planning Guide

Web XMR miner POC: Educational browser-based WebAssembly performance demonstrator showing parallel computing capabilities, resource management, and real-time telemetry through cryptographic hash benchmarking.

**Experience Qualities**:
1. **Transparent** - Every action, resource usage, and performance metric is visible and explained to build trust
2. **Educational** - Users learn about browser constraints, parallel computing, and consent-driven resource usage
3. **Empowering** - Complete user control over CPU usage, threading, and execution with safety guardrails

**Complexity Level**: Light Application (multiple features with basic state)
- Single-purpose benchmark tool with configurable parameters, real-time telemetry, and data export capabilities

## Essential Features

### Consent Gate
- **Functionality**: Checkbox + disabled start button pattern that requires explicit acknowledgment
- **Purpose**: Establish ethical computing pattern and user agency
- **Trigger**: Page load shows disabled controls
- **Progression**: User reads warning → checks consent → Start enabled → can begin benchmark
- **Success criteria**: Cannot start benchmark without explicit consent check

### Benchmark Control Panel
- **Functionality**: Configure threads (1-8), throttle (0-90%), duration (15s/60s/5min), and execution controls
- **Purpose**: Give users full control over resource usage intensity
- **Trigger**: User adjusts sliders/selects before or during benchmark
- **Progression**: Configure settings → click Start → workers spawn → real-time metrics appear → auto-stop at duration or manual stop
- **Success criteria**: All controls responsive, changes apply immediately, Stop kills workers instantly

### Live Telemetry Dashboard
- **Functionality**: Real-time display of hashrate, total hashes, worker status, CPU estimates, memory usage
- **Purpose**: Show exactly what the browser is doing with resources
- **Trigger**: Benchmark starts
- **Progression**: Workers initialize → metrics start flowing → rolling average calculations → visual indicators update → final report on completion
- **Success criteria**: Sub-second metric updates, accurate aggregation across workers, clear state indicators

### Benchmark Report Export
- **Functionality**: Download JSON report with device info, config, time-series data, and summary statistics
- **Purpose**: Enable reproducible performance comparisons across devices/browsers
- **Trigger**: Benchmark completes or user clicks Export
- **Progression**: Collect telemetry → format as structured JSON → trigger download
- **Success criteria**: Valid JSON with complete benchmark metadata and results

### Educational Context Panel
- **Functionality**: Collapsible sections explaining what's happening, browser constraints, why this approach
- **Purpose**: Transform tool into learning experience about browser computing
- **Trigger**: Always visible, can expand sections
- **Progression**: User explores sections → understands technical concepts → makes informed decisions
- **Success criteria**: Clear explanations of workers, WebAssembly, throttling, and browser limitations

## Edge Case Handling

- **Browser incompatibility** - Detect Worker/Wasm support, show clear error with browser requirements
- **Memory exhaustion** - Catch allocation failures, reduce threads automatically, show user-friendly warning
- **Hidden tab throttling** - Detect visibility change, pause benchmark, show "paused" state clearly
- **Mid-run config changes** - Apply throttle changes immediately to running workers without restart
- **Worker crashes** - Detect, log error, continue with remaining workers, show degraded state
- **Excessive duration** - Warn at >5min selections, require secondary confirmation for extreme durations

## Design Direction

The design should evoke **scientific precision, transparency, and control** - like a laboratory instrument panel. Users should feel they're conducting an experiment with professional-grade measurement tools, not triggering something unpredictable. Clinical aesthetics with data visualization emphasis.

## Color Selection

**Technical laboratory aesthetic with high-contrast data visualization**

- **Primary Color**: Deep Navy `oklch(0.25 0.05 250)` - Scientific credibility and seriousness
- **Secondary Colors**: 
  - Charcoal `oklch(0.35 0.01 250)` - UI scaffolding and containers
  - Soft Slate `oklch(0.65 0.02 250)` - Muted backgrounds for secondary panels
- **Accent Color**: Electric Cyan `oklch(0.75 0.15 200)` - Active states, running indicators, data highlights
- **Foreground/Background Pairings**:
  - Primary (Deep Navy): White `oklch(0.98 0 0)` - Ratio 9.8:1 ✓
  - Charcoal: White `oklch(0.98 0 0)` - Ratio 7.2:1 ✓
  - Accent (Electric Cyan): Deep Navy `oklch(0.25 0.05 250)` - Ratio 4.7:1 ✓
  - Background (Off-white `oklch(0.97 0.005 250)`): Foreground (Near-black `oklch(0.2 0.01 250)`) - Ratio 12.5:1 ✓

## Font Selection

**Monospaced precision meets clean sans-serif for data clarity**

- **Primary**: JetBrains Mono for all numeric data, metrics, and code-adjacent content
- **Secondary**: Space Grotesk for headings, labels, and body text
- **Typographic Hierarchy**:
  - H1 (Panel Titles): Space Grotesk Bold/24px/tight tracking
  - H2 (Section Headers): Space Grotesk Semibold/18px/normal tracking
  - Metrics (Live Data): JetBrains Mono Medium/32px/tabular nums
  - Labels: Space Grotesk Regular/14px/wide tracking (uppercase)
  - Body Text: Space Grotesk Regular/15px/relaxed leading
  - Small Data: JetBrains Mono Regular/13px/tabular nums

## Animations

Animations should reinforce the sense of **active computation and real-time measurement**. Pulsing indicators show workers are alive, smooth value transitions prevent jarring updates, and state changes use clinical precision (fast, decisive) rather than playful bounces. Data updates animate with subtle easing to show continuous change without distraction.

## Component Selection

- **Components**:
  - Card - Main dashboard container and metric panels with subtle borders
  - Button - Start/Stop/Export with distinct primary/destructive variants
  - Checkbox - Consent gate with custom styled check indicator
  - Slider - Thread count and throttle with visible track fill
  - Select - Duration picker with clear option display
  - Badge - Worker status indicators (running/idle/error) with color coding
  - Progress - Initialization and duration countdown with percentage
  - Separator - Clean divisions between metric sections
  - Collapsible - Educational content sections with smooth expand
  - Alert - Warnings for battery, overheating, browser incompatibility

- **Customizations**:
  - Custom metric display component with large monospace numbers and unit labels
  - Worker status grid showing per-worker health with pulse animations
  - Rolling hashrate chart using simple SVG line graph
  - Throttle visualization showing work/sleep duty cycle as animated bars

- **States**:
  - Buttons: Disabled (consent gate), Running pulse (active benchmark), Destructive (Stop)
  - Sliders: Disabled during run (threads), Active during run (throttle)
  - Metrics: Idle (dashes), Initializing (skeleton), Running (live updates), Complete (final values)

- **Icon Selection**:
  - Play (Play) for Start
  - Stop (Stop) for immediate halt
  - DownloadSimple for report export
  - Warning (WarningCircle) for battery/thermal alerts
  - Cpu (Cpu) for worker indicators
  - ChartLine for performance metrics
  - Info (Info) for educational tooltips

- **Spacing**:
  - Container padding: p-6 for main cards, p-4 for nested sections
  - Metric spacing: gap-8 for primary metrics, gap-4 for labels
  - Control spacing: gap-6 for control groups, gap-3 for individual controls
  - Grid gaps: gap-3 for worker status grid

- **Mobile**:
  - Stack metrics vertically instead of grid layout
  - Reduce metric font sizes (32px → 24px)
  - Collapsible controls into accordion sections
  - Full-width buttons with touch-friendly 48px height
  - Hide non-critical worker detail, show aggregate only
