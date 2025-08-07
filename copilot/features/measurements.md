### 📏 Add `measurements` Table for Tracking Body Metrics & Body Fat %

#### Summary

We want to add a `measurements` table to support tracking body metrics like weight, waist, neck, etc., along with calculated body fat percentage over time. This will be used for progress tracking and visual trendlines.

---

#### 💾 Schema Proposal

```ts
type Measurement = {
  id: string;
  user_id: string;
  timestamp: Date;

  // Core measurements
  weight_lbs?: number; // stored in pounds
  neck_cm?: number;
  waist_cm?: number; // averaged from other waist fields
  hip_cm?: number; // optional, needed for female formulas

  body_fat_percentage?: number; // calculated at time of entry
  notes?: string;

  // Extra measurements (optional and flexible)
  extra?: Record<string, number>; // e.g. {
  //   "waist_at_navel_cm": 93,
  //   "waist_above_navel_cm": 91,
  //   "waist_below_navel_cm": 94,
  //   "bicep_flexed_cm": 34
  // }
};
```

---

#### 🧠 Key Behavior

- `waist_cm` is the **averaged value** from `waist_above_navel_cm`, `waist_at_navel_cm`, and `waist_below_navel_cm` (if provided).
- `body_fat_percentage` is calculated on entry using a chosen formula (e.g., US Navy) and stored for charting.
- All fields are optional except `timestamp` and `user_id`.
- `extra` allows flexibility for future measurements (e.g., thigh_cm, bicep_flexed_cm, etc.)
- `height_cm` should be added to the user database to support body fat calculation. Indicate it is optional and used for body fat calculations only.
- `sex` needs to be added to user database as well. Indicate it is optional and used for body fat calculations only.

---

#### 📐 Body Fat Formula (U.S. Navy Method)

To be calculated in **centimeters**:

**For men:**

```ts
// inputs: waist_cm, neck_cm, height_cm
const bodyFatMen = (weight_lbs: number, waist_cm: number, neck_cm: number, height_cm: number): number => {
  const waist_in = cmToIn(waist_cm);
  const neck_in = cmToIn(neck_cm);
  const height_in = cmToIn(height_cm);

  return 495 / (1.0324 - 0.19077 * Math.log10(waist_in - neck_in) + 0.15456 * Math.log10(height_in)) - 450;
};
```

**For women:**

```ts
// inputs: waist_cm, neck_cm, hip_cm, height_cm
const bodyFatWomen = (weight_lbs: number, waist_cm: number, neck_cm: number, hip_cm: number, height_cm: number): number => {
  const waist_in = cmToIn(waist_cm);
  const neck_in = cmToIn(neck_cm);
  const hip_in = cmToIn(hip_cm);
  const height_in = cmToIn(height_cm);

  return 495 / (1.29579 - 0.35004 * Math.log10(waist_in + hip_in - neck_in) + 0.221 * Math.log10(height_in)) - 450;
};
```

- Only calculate `body_fat_percentage` if required inputs are present.

---

#### ✅ Acceptance Criteria

- [x] Create `measurements` table with schema above
- [x] Support writing new measurements with optional `extra` fields
- [x] Calculate and store `waist_cm` as average of up to 3 inputs
- [x] Calculate and store `body_fat_percentage` using Navy method if `waist_cm`, `neck_cm`, and `height_cm` are present
- [x] Allow retrieving historical data, displaying `waist_cm` average but preserving raw inputs
- [x] Support multiple entries per day
