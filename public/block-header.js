/**
 * Block Header Module for Realistic Mining Simulation
 * 
 * This module provides:
 * - Monero-style block header structure (76 bytes)
 * - Binary serialization using Uint8Array
 * - Nonce space partitioning for multi-worker mining
 * - Block template management
 * 
 * Note: This is for educational purposes. Structure is simplified but maintains
 * realistic size and binary format characteristics.
 */

/**
 * Monero Block Header Structure (76 bytes)
 * 
 * Field Layout:
 * - Version (4 bytes)
 * - Timestamp (4 bytes)
 * - Previous Block Hash (32 bytes)
 * - Nonce (4 bytes)
 * - Merkle Root (32 bytes)
 */
class BlockHeader {
  constructor(version, prevHash, merkleRoot, timestamp, nonce = 0) {
    this.version = version;
    this.prevHash = prevHash; // 64-char hex string (32 bytes)
    this.merkleRoot = merkleRoot; // 64-char hex string (32 bytes)
    this.timestamp = timestamp;
    this.nonce = nonce;
  }

  /**
   * Set nonce value
   */
  setNonce(nonce) {
    this.nonce = nonce;
  }

  /**
   * Update timestamp
   */
  updateTimestamp(timestamp) {
    this.timestamp = timestamp;
  }

  /**
   * Serialize block header to binary format (Uint8Array)
   * Total size: 76 bytes
   */
  serialize() {
    const buffer = new Uint8Array(76);
    let offset = 0;

    // Version (4 bytes, little-endian)
    buffer[offset++] = this.version & 0xFF;
    buffer[offset++] = (this.version >> 8) & 0xFF;
    buffer[offset++] = (this.version >> 16) & 0xFF;
    buffer[offset++] = (this.version >> 24) & 0xFF;

    // Timestamp (4 bytes, little-endian)
    buffer[offset++] = this.timestamp & 0xFF;
    buffer[offset++] = (this.timestamp >> 8) & 0xFF;
    buffer[offset++] = (this.timestamp >> 16) & 0xFF;
    buffer[offset++] = (this.timestamp >> 24) & 0xFF;

    // Previous Block Hash (32 bytes)
    const prevHashBytes = hexToBytes(this.prevHash);
    for (let i = 0; i < 32; i++) {
      buffer[offset++] = prevHashBytes[i];
    }

    // Nonce (4 bytes, little-endian)
    buffer[offset++] = this.nonce & 0xFF;
    buffer[offset++] = (this.nonce >> 8) & 0xFF;
    buffer[offset++] = (this.nonce >> 16) & 0xFF;
    buffer[offset++] = (this.nonce >> 24) & 0xFF;

    // Merkle Root (32 bytes)
    const merkleRootBytes = hexToBytes(this.merkleRoot);
    for (let i = 0; i < 32; i++) {
      buffer[offset++] = merkleRootBytes[i];
    }

    return buffer;
  }
}

/**
 * Partition nonce space between workers
 * Returns start and end nonce for a given worker
 * 
 * Example with 4 workers:
 * - Worker 0: 0 to 1073741823
 * - Worker 1: 1073741824 to 2147483647
 * - Worker 2: 2147483648 to 3221225471
 * - Worker 3: 3221225472 to 4294967295
 */
function partitionNonceSpace(workerId, totalWorkers) {
  const MAX_UINT32 = 0xFFFFFFFF; // 4294967295
  const partitionSize = Math.floor(MAX_UINT32 / totalWorkers);
  
  const nonceStart = workerId * partitionSize;
  const nonceEnd = workerId === totalWorkers - 1 
    ? MAX_UINT32 
    : (workerId + 1) * partitionSize - 1;

  return { nonceStart, nonceEnd };
}

/**
 * Generate a random merkle root (32 bytes / 64 hex chars)
 * In real mining, this comes from the transaction merkle tree
 */
function generateMerkleRoot() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Generate a new seed for cache reinitialization
 * In real Monero mining, this is derived from blockchain height
 */
function generateNewSeed() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Convert hex string to byte array
 */
function hexToBytes(hex) {
  // Remove any spaces or 0x prefix
  hex = hex.replace(/^0x/, '').replace(/\s/g, '');
  
  // Pad to 64 chars (32 bytes) if needed
  hex = hex.padEnd(64, '0');
  
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16) || 0;
  }
  return bytes;
}

/**
 * Convert byte array to hex string
 */
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Export for use in worker
if (typeof self !== 'undefined' && typeof self.postMessage !== 'undefined') {
  // Running in a worker context
  self.BlockHeader = BlockHeader;
  self.partitionNonceSpace = partitionNonceSpace;
  self.generateMerkleRoot = generateMerkleRoot;
  self.generateNewSeed = generateNewSeed;
  self.hexToBytes = hexToBytes;
  self.bytesToHex = bytesToHex;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BlockHeader,
    partitionNonceSpace,
    generateMerkleRoot,
    generateNewSeed,
    hexToBytes,
    bytesToHex
  };
}
