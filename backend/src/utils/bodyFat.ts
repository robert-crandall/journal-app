/**
 * Body fat calculation utilities using the U.S. Navy method
 */

// Conversion helper functions
export const cmToIn = (cm: number): number => cm / 2.54;
export const inToCm = (inches: number): number => inches * 2.54;

/**
 * Calculate body fat percentage for men using U.S. Navy method
 * @param waistCm Waist measurement in centimeters
 * @param neckCm Neck measurement in centimeters  
 * @param heightCm Height measurement in centimeters
 * @returns Body fat percentage (0-100)
 */
export const calculateBodyFatMen = (
  waistCm: number,
  neckCm: number,
  heightCm: number
): number => {
  const waistIn = cmToIn(waistCm);
  const neckIn = cmToIn(neckCm);
  const heightIn = cmToIn(heightCm);

  return (
    495 /
      (1.0324 -
        0.19077 * Math.log10(waistIn - neckIn) +
        0.15456 * Math.log10(heightIn)) -
    450
  );
};

/**
 * Calculate body fat percentage for women using U.S. Navy method
 * @param waistCm Waist measurement in centimeters
 * @param neckCm Neck measurement in centimeters
 * @param hipCm Hip measurement in centimeters
 * @param heightCm Height measurement in centimeters
 * @returns Body fat percentage (0-100)
 */
export const calculateBodyFatWomen = (
  waistCm: number,
  neckCm: number,
  hipCm: number,
  heightCm: number
): number => {
  const waistIn = cmToIn(waistCm);
  const neckIn = cmToIn(neckCm);
  const hipIn = cmToIn(hipCm);
  const heightIn = cmToIn(heightCm);

  return (
    495 /
      (1.29579 -
        0.35004 * Math.log10(waistIn + hipIn - neckIn) +
        0.22100 * Math.log10(heightIn)) -
    450
  );
};

/**
 * Calculate average waist measurement from multiple inputs
 * @param waistAtNavelCm Waist at navel measurement
 * @param waistAboveNavelCm Waist above navel measurement
 * @param waistBelowNavelCm Waist below navel measurement
 * @returns Average waist measurement in centimeters
 */
export const calculateAverageWaist = (
  waistAtNavelCm?: number | null,
  waistAboveNavelCm?: number | null,
  waistBelowNavelCm?: number | null
): number | null => {
  const validMeasurements = [waistAtNavelCm, waistAboveNavelCm, waistBelowNavelCm].filter(
    (measurement): measurement is number => measurement !== null && measurement !== undefined
  );

  if (validMeasurements.length === 0) {
    return null;
  }

  return validMeasurements.reduce((sum, measurement) => sum + measurement, 0) / validMeasurements.length;
};

/**
 * Calculate body fat percentage based on user sex and available measurements
 * @param sex User's sex ('male' or 'female')
 * @param waistCm Average waist measurement in centimeters
 * @param neckCm Neck measurement in centimeters
 * @param heightCm Height measurement in centimeters
 * @param hipCm Hip measurement in centimeters (required for women)
 * @returns Body fat percentage or null if insufficient data
 */
export const calculateBodyFatPercentage = (
  sex: 'male' | 'female',
  waistCm: number | null,
  neckCm: number | null,
  heightCm: number | null,
  hipCm?: number | null
): number | null => {
  // Check if we have required measurements
  if (!waistCm || !neckCm || !heightCm) {
    return null;
  }

  try {
    if (sex === 'male') {
      return Math.round(calculateBodyFatMen(waistCm, neckCm, heightCm) * 10) / 10; // Round to 1 decimal
    } else if (sex === 'female') {
      if (!hipCm) {
        return null; // Hip measurement required for women
      }
      return Math.round(calculateBodyFatWomen(waistCm, neckCm, hipCm, heightCm) * 10) / 10; // Round to 1 decimal
    }
  } catch (error) {
    // Return null if calculation fails (e.g., invalid log10 input)
    return null;
  }

  return null;
};
