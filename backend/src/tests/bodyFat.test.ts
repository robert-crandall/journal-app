import { describe, it, expect } from 'vitest';
import { calculateBodyFatMen, calculateBodyFatWomen, calculateAverageWaist, calculateBodyFatPercentage, cmToIn } from '../utils/bodyFat';

describe('Body Fat Calculation Utilities', () => {
  describe('cmToIn', () => {
    it('should convert cm to inches correctly', () => {
      expect(cmToIn(175)).toBeCloseTo(68.9, 1);
      expect(cmToIn(92)).toBeCloseTo(36.2, 1);
      expect(cmToIn(38)).toBeCloseTo(15.0, 1);
    });
  });

  describe('calculateAverageWaist', () => {
    it('should calculate average from all three measurements', () => {
      expect(calculateAverageWaist(92, 90, 94)).toBe(92);
    });

    it('should calculate average from two measurements', () => {
      expect(calculateAverageWaist(90, null, 94)).toBe(92);
    });

    it('should return single measurement if only one provided', () => {
      expect(calculateAverageWaist(92, null, null)).toBe(92);
    });

    it('should return null if no measurements provided', () => {
      expect(calculateAverageWaist(null, null, null)).toBeNull();
    });
  });

  describe('calculateBodyFatMen', () => {
    it('should calculate body fat percentage for men', () => {
      // Test with realistic values: waist=92cm, neck=38cm, height=175cm
      const result = calculateBodyFatMen(92, 38, 175);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(50); // Should be a reasonable percentage
    });
  });

  describe('calculateBodyFatWomen', () => {
    it('should calculate body fat percentage for women', () => {
      // Test with realistic values: waist=68cm, neck=32cm, hip=95cm, height=165cm
      const result = calculateBodyFatWomen(68, 32, 95, 165);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(50); // Should be a reasonable percentage
    });
  });

  describe('calculateBodyFatPercentage', () => {
    it('should calculate for male with valid measurements', () => {
      const result = calculateBodyFatPercentage('male', 92, 38, 175);
      expect(result).not.toBeNull();
      expect(result).toBeGreaterThan(0);
    });

    it('should calculate for female with valid measurements', () => {
      const result = calculateBodyFatPercentage('female', 68, 32, 165, 95);
      expect(result).not.toBeNull();
      expect(result).toBeGreaterThan(0);
    });

    it('should return null for male without required measurements', () => {
      expect(calculateBodyFatPercentage('male', null, null, 175)).toBeNull();
      expect(calculateBodyFatPercentage('male', 92, null, 175)).toBeNull();
      expect(calculateBodyFatPercentage('male', 92, 38, null)).toBeNull();
    });

    it('should return null for female without hip measurement', () => {
      expect(calculateBodyFatPercentage('female', 68, 32, 165)).toBeNull();
    });

    it('should return null for female without required measurements', () => {
      expect(calculateBodyFatPercentage('female', null, 32, 165, 95)).toBeNull();
    });
  });
});
