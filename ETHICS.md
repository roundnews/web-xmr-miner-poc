# Ethics & Consent Framework

## Core Principles

This project is built on four foundational ethical principles:

### 1. Radical Transparency
Every aspect of what this application does is clearly communicated:
- Source code is open and auditable
- Behavior is documented in detail
- No hidden functionality or obfuscated code
- Clear warnings about resource usage

### 2. User Agency & Consent
Users maintain complete control at all times:
- **Explicit opt-in required** - Nothing runs without consent
- **Easy opt-out** - Stop button immediately terminates execution
- **Configurable intensity** - Users choose thread count and throttling
- **Visible state** - Always clear when computation is active

### 3. Educational Purpose
This is a learning tool, not production software:
- Teaches parallel computing concepts
- Demonstrates browser capabilities and limitations
- Shows responsible resource management patterns
- Provides reproducible performance data

### 4. No Harm
Designed to prevent misuse and abuse:
- No auto-start on page load
- No hidden iframes or background execution
- No service workers that persist after close
- No bypassing of browser security controls
- Safety warnings and throttle defaults

## Consent Implementation

### Multi-Layer Consent Model

1. **Informational Layer**
   - Clear description of what the tool does
   - Warnings about battery and thermal impact
   - Educational context provided upfront

2. **Explicit Acknowledgment**
   - Checkbox must be manually checked
   - Controls disabled until consent given
   - Cannot be pre-checked or bypassed

3. **Active Control**
   - Start button must be clicked
   - No auto-start via URL parameters
   - No hidden triggers

4. **Continuous Agency**
   - Stop button always available
   - Duration limits enforced
   - Can adjust throttle during execution

### What Consent Covers

When users consent, they acknowledge understanding that:
- CPU resources will be used
- Battery may drain faster on mobile devices
- Device may become warm
- Background tabs will be throttled
- They can stop at any time

## Responsible Use Guidelines

### ✅ Acceptable Uses

- **Education:** Learning about Web Workers and parallel computing
- **Benchmarking:** Testing device/browser performance
- **Research:** Studying browser computing constraints
- **Comparison:** Collecting reproducible performance data
- **Teaching:** Demonstrating browser capabilities in courses

### 🚫 Unacceptable Uses

- **Cryptojacking:** Embedding without consent in third-party sites
- **Stealth execution:** Hidden or obfuscated deployment
- **Deception:** Disguising purpose or resource usage
- **Malware:** Bundling with harmful software
- **Abuse:** Circumventing safety controls or consent mechanisms

## Privacy Guarantees

### Zero Data Collection
- No analytics or tracking
- No server communication after page load
- No cookies or local storage (except for seeded examples)
- No user identification
- No telemetry transmission

### Local-Only Execution
- All computation happens in browser
- Results stay on device
- Export is user-initiated and local-only
- No accounts or authentication

### No Third-Party Services
- No external API calls
- No CDN tracking
- No embedded analytics
- No social media widgets

## Safety Features

### Built-In Protections

1. **Conservative Defaults**
   - Single thread
   - 30% throttle
   - 60 second duration
   - Must be manually increased

2. **Hard Limits**
   - Maximum 8 threads (even on higher-core systems)
   - Maximum 90% throttle (cannot fully max CPU)
   - Duration timeout enforced

3. **Visibility Handling**
   - Warning when tab becomes hidden
   - Notification of browser throttling

4. **Error Handling**
   - Graceful degradation on worker failures
   - Clear error messages
   - Automatic cleanup on errors

### User Warnings

The application provides warnings for:
- Battery drain on mobile devices
- Potential device warmth
- Background throttling in hidden tabs
- Long duration selections
- High thread counts

## Anti-Abuse Design

### Preventing Malicious Use

1. **No Stealth Capability**
   - Cannot hide from user
   - Cannot run in background
   - Cannot persist after tab close
   - Cannot auto-start

2. **No Network Coordination**
   - Workers don't communicate externally
   - No pool mining capability
   - No remote control interface
   - No botnet functionality

3. **Limited Scope**
   - Sandboxed execution
   - No system access
   - No file system access
   - No network sockets

4. **Auditable Code**
   - Open source
   - Well-documented
   - No minification in repo
   - Clear architecture

## Browser Cooperation

### Working Within Browser Limits

This application respects and documents browser constraints:
- Memory allocation limits
- Background tab throttling
- Security sandboxing
- Resource quotas

### Security Model Respect

We do not attempt to:
- Bypass same-origin policy
- Circumvent content security policy
- Exploit browser vulnerabilities
- Disable security features

## Educational Value Statement

### What This Teaches

**Technical Concepts:**
- Web Worker parallelism
- Cryptographic hash functions
- Browser performance characteristics
- Resource management and throttling
- Worker coordination patterns

**Ethical Concepts:**
- Consent-driven design
- Transparent resource usage
- User agency in computing
- Responsible tool development

**Practical Skills:**
- Performance benchmarking
- Browser compatibility testing
- Worker communication protocols
- Real-time telemetry implementation

## Comparison to Harmful Patterns

### How This Differs from Cryptojacking

| This Tool | Cryptojacking |
|-----------|---------------|
| ✅ Explicit consent required | ❌ Hidden from user |
| ✅ Clear resource warnings | ❌ Stealth execution |
| ✅ Easy stop mechanism | ❌ Difficult to detect/stop |
| ✅ Educational purpose | ❌ Profit motive |
| ✅ Open source | ❌ Obfuscated code |
| ✅ No network mining | ❌ Joins mining pools |
| ✅ Local-only results | ❌ Sends hashpower remotely |
| ✅ Conservative defaults | ❌ Maximum exploitation |

## Developer Responsibility

If you fork or modify this project:

### ✅ Maintain These Principles
- Keep consent mechanisms
- Preserve transparency
- Document all changes
- Maintain educational focus

### ✅ Do Not
- Remove consent requirements
- Add auto-start functionality
- Obfuscate code
- Add network mining capability
- Hide resource usage
- Market as production mining software

### ✅ If You Distribute
- Keep this ethics document
- Link to original repo
- Document your changes
- Maintain open source license
- Preserve safety features

## Reporting Misuse

If you discover this code being used maliciously:
1. Document the URL and behavior
2. Report to browser safe browsing
3. Contact the repository maintainers
4. Report to hosting provider

## Legal Considerations

### Compliance
- No deceptive practices
- Clear disclosure of functionality
- Respect for user autonomy
- Privacy-preserving design

### Terms of Use
Users of this application:
- Use at their own discretion
- Understand resource consumption
- Accept no warranty or liability
- Agree to responsible use

### Liability Disclaimer
This is provided as-is for educational purposes. Developers are not responsible for:
- Device damage from misuse
- Excessive resource consumption
- Battery drain or thermal issues
- Third-party modifications
- Improper deployments

## Continuous Improvement

We welcome feedback on:
- Additional safety features
- Clearer consent mechanisms
- Better educational content
- Enhanced transparency
- Improved user controls

## Conclusion

This project demonstrates that:
- Resource-intensive computing can be ethical with proper consent
- Transparency and user control are fundamental
- Educational tools can be powerful without being exploitative
- Open source enables accountability

By maintaining these standards, we create a trustworthy tool that advances understanding while respecting users.

---

**Remember:** With great computing power comes great responsibility. Always prioritize user consent, transparency, and education.
