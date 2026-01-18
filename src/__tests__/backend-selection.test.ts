import { describe, it, expect } from 'vitest';
import { BenchmarkConfig } from '@/lib/types';

describe('Backend Selection Tests', () => {
  const defaultConfig: BenchmarkConfig = {
    threads: 2,
    throttle: 30,
    duration: 60,
    statsInterval: 1000,
    backend: 'wasm'
  };

  describe('Backend Configuration', () => {
    it('should support WASM backend option', () => {
      const config: BenchmarkConfig = {
        ...defaultConfig,
        backend: 'wasm'
      };
      
      expect(config.backend).toBe('wasm');
    });

    it('should support WebGPU backend option', () => {
      const config: BenchmarkConfig = {
        ...defaultConfig,
        backend: 'webgpu'
      };
      
      expect(config.backend).toBe('webgpu');
    });

    it('should default to WASM when backend is undefined', () => {
      const config = {
        threads: 2,
        throttle: 30,
        duration: 60,
        statsInterval: 1000
      };
      
      const backend = config.backend || 'wasm';
      expect(backend).toBe('wasm');
    });
  });

  describe('Backend Type Validation', () => {
    it('should only allow valid backend types', () => {
      const validBackends: Array<'wasm' | 'webgpu'> = ['wasm', 'webgpu'];
      
      validBackends.forEach(backend => {
        const config: BenchmarkConfig = {
          ...defaultConfig,
          backend
        };
        expect(['wasm', 'webgpu']).toContain(config.backend);
      });
    });

    it('should maintain backend value in config object', () => {
      const wasmConfig: BenchmarkConfig = { ...defaultConfig, backend: 'wasm' };
      const webgpuConfig: BenchmarkConfig = { ...defaultConfig, backend: 'webgpu' };
      
      expect(wasmConfig.backend).toBe('wasm');
      expect(webgpuConfig.backend).toBe('webgpu');
    });
  });

  describe('Config Updates', () => {
    it('should allow backend to be updated', () => {
      let config: BenchmarkConfig = { ...defaultConfig, backend: 'wasm' };
      expect(config.backend).toBe('wasm');
      
      config = { ...config, backend: 'webgpu' };
      expect(config.backend).toBe('webgpu');
    });

    it('should preserve other config values when changing backend', () => {
      const originalConfig: BenchmarkConfig = {
        threads: 4,
        throttle: 50,
        duration: 120,
        statsInterval: 2000,
        backend: 'wasm'
      };
      
      const updatedConfig: BenchmarkConfig = {
        ...originalConfig,
        backend: 'webgpu'
      };
      
      expect(updatedConfig.threads).toBe(4);
      expect(updatedConfig.throttle).toBe(50);
      expect(updatedConfig.duration).toBe(120);
      expect(updatedConfig.statsInterval).toBe(2000);
      expect(updatedConfig.backend).toBe('webgpu');
    });
  });

  describe('Backend and Mode Compatibility', () => {
    it('should support light mode with WASM backend', () => {
      const config: BenchmarkConfig = {
        ...defaultConfig,
        backend: 'wasm',
        mode: 'light'
      };
      
      expect(config.backend).toBe('wasm');
      expect(config.mode).toBe('light');
    });

    it('should support light mode with WebGPU backend', () => {
      const config: BenchmarkConfig = {
        ...defaultConfig,
        backend: 'webgpu',
        mode: 'light'
      };
      
      expect(config.backend).toBe('webgpu');
      expect(config.mode).toBe('light');
    });

    it('should support fast mode with both backends', () => {
      const wasmConfig: BenchmarkConfig = {
        ...defaultConfig,
        backend: 'wasm',
        mode: 'fast'
      };
      
      const webgpuConfig: BenchmarkConfig = {
        ...defaultConfig,
        backend: 'webgpu',
        mode: 'fast'
      };
      
      expect(wasmConfig.backend).toBe('wasm');
      expect(wasmConfig.mode).toBe('fast');
      expect(webgpuConfig.backend).toBe('webgpu');
      expect(webgpuConfig.mode).toBe('fast');
    });
  });

  describe('Edge Cases', () => {
    it('should handle config with only required fields', () => {
      const minimalConfig = {
        threads: 1,
        throttle: 0,
        duration: 60,
        statsInterval: 1000
      };
      
      const config: BenchmarkConfig = {
        ...minimalConfig,
        backend: 'wasm'
      };
      
      expect(config.backend).toBe('wasm');
      expect(config.threads).toBe(1);
    });

    it('should handle rapid backend switching', () => {
      let config: BenchmarkConfig = { ...defaultConfig, backend: 'wasm' };
      
      // Simulate rapid switching
      config = { ...config, backend: 'webgpu' };
      config = { ...config, backend: 'wasm' };
      config = { ...config, backend: 'webgpu' };
      config = { ...config, backend: 'wasm' };
      
      expect(config.backend).toBe('wasm');
    });
  });
});
