import { getSystemMetrics, formatBytes } from '../src/utils/osMetrics';

describe('OS Metrics Utility', () => {
  describe('getSystemMetrics', () => {
    it('should return valid system metrics object', () => {
      const metrics = getSystemMetrics();
      
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('disk');
      expect(metrics).toHaveProperty('network');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('platform');
      expect(metrics).toHaveProperty('timestamp');
    });

    it('should have valid CPU metrics', () => {
      const metrics = getSystemMetrics();
      
      expect(metrics.cpu).toHaveProperty('usage');
      expect(metrics.cpu).toHaveProperty('cores');
      expect(metrics.cpu).toHaveProperty('model');
      expect(metrics.cpu).toHaveProperty('speed');
      expect(Array.isArray(metrics.cpu.speed)).toBe(true);
      expect(typeof metrics.cpu.usage).toBe('number');
      expect(metrics.cpu.cores).toBeGreaterThan(0);
    });

    it('should have valid memory metrics', () => {
      const metrics = getSystemMetrics();
      
      expect(metrics.memory).toHaveProperty('total');
      expect(metrics.memory).toHaveProperty('free');
      expect(metrics.memory).toHaveProperty('used');
      expect(metrics.memory).toHaveProperty('usagePercent');
      expect(metrics.memory.total).toBeGreaterThan(0);
      expect(metrics.memory.used).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.usagePercent).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.usagePercent).toBeLessThanOrEqual(100);
    });

    it('should have valid disk metrics', () => {
      const metrics = getSystemMetrics();
      
      expect(metrics.disk).toHaveProperty('total');
      expect(metrics.disk).toHaveProperty('free');
      expect(metrics.disk).toHaveProperty('used');
      expect(metrics.disk).toHaveProperty('usagePercent');
      expect(metrics.disk.usagePercent).toBeGreaterThanOrEqual(0);
      expect(metrics.disk.usagePercent).toBeLessThanOrEqual(100);
    });
  });

  describe('formatBytes', () => {
    it('should format zero bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 2)).toBe('1.5 KB');
    });
  });
});
