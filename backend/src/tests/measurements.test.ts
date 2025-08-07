import { describe, it, expect, beforeEach } from 'vitest';
import appExport from '../index';
import { getTestDb, getUniqueEmail } from './setup';
import { eq, desc } from 'drizzle-orm';
import { users, measurements } from '../db/schema';
import type {
  CreateMeasurementRequest,
  UpdateMeasurementRequest,
  MeasurementResponse,
  ListMeasurementsResponse,
} from '../../../shared/types/measurements';
import type { User } from '../../../shared/types/users';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

const testDb = getTestDb();

describe('Measurements API Integration Tests', () => {
  let testUser: User;
  let authToken: string;

  beforeEach(async () => {
    // Create a test user for each test
    const userData = {
      name: 'Test User',
      email: getUniqueEmail('test'),
      password: 'password123',
      heightCm: 175.0,
      sex: 'male' as const,
    };

    const res = await app.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { user, token } = await res.json();
    testUser = user;
    authToken = token;
  });

  describe('POST /api/measurements', () => {
    it('should create a new measurement with minimal data', async () => {
      const measurementData: CreateMeasurementRequest = {
        weightLbs: 185.5,
        notes: 'Morning measurement',
      };

      const res = await app.request('/api/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      
      const measurement: MeasurementResponse = responseData.data;
      expect(measurement.id).toBeDefined();
      expect(measurement.userId).toBe(testUser.id);
      expect(measurement.weightLbs).toBe(185.5);
      expect(measurement.notes).toBe('Morning measurement');
      expect(measurement.bodyFatPercentage).toBeNull(); // No waist/neck measurements
      expect(measurement.timestamp).toBeDefined();
    });

    it('should create a measurement with body fat calculation for male', async () => {
      const measurementData: CreateMeasurementRequest = {
        weightLbs: 180,
        neckCm: 38,
        waistAtNavelCm: 92,
        waistAboveNavelCm: 90,
        waistBelowNavelCm: 94,
        notes: 'Full body measurement',
      };

      const res = await app.request('/api/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      expect(responseData.success).toBe(true);
      const measurement: MeasurementResponse = responseData.data;
      
      // Check averaged waist calculation: (92 + 90 + 94) / 3 = 92
      expect(measurement.waistCm).toBe(92);
      expect(measurement.neckCm).toBe(38);
      expect(measurement.bodyFatPercentage).not.toBeNull();
      expect(typeof measurement.bodyFatPercentage).toBe('number');
      
      // Check raw waist measurements are preserved
      expect(measurement.waistAtNavelCm).toBe(92);
      expect(measurement.waistAboveNavelCm).toBe(90);
      expect(measurement.waistBelowNavelCm).toBe(94);
      
      // Verify extra field contains raw measurements
      expect(measurement.extra).toBeDefined();
      if (measurement.extra) {
        expect(measurement.extra.waistAtNavelCm).toBe(92);
        expect(measurement.extra.waistAboveNavelCm).toBe(90);
        expect(measurement.extra.waistBelowNavelCm).toBe(94);
      }
    });

    it('should create a measurement with custom extra fields', async () => {
      const measurementData: CreateMeasurementRequest = {
        weightLbs: 175,
        extra: {
          bicep_flexed_cm: 34,
          thigh_cm: 58,
        },
      };

      const res = await app.request('/api/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      const measurement: MeasurementResponse = responseData.data;
      expect(measurement.extra).toBeDefined();
      if (measurement.extra) {
        expect(measurement.extra.bicepFlexedCm).toBe(34);
        expect(measurement.extra.thighCm).toBe(58);
      }
    });

    it('should require authentication', async () => {
      const measurementData: CreateMeasurementRequest = {
        weightLbs: 180,
      };

      const res = await app.request('/api/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/measurements', () => {
    let measurement1: MeasurementResponse;
    let measurement2: MeasurementResponse;

    beforeEach(async () => {
      // Create test measurements
      const measurementData1: CreateMeasurementRequest = {
        weightLbs: 180,
        neckCm: 38,
        waistAtNavelCm: 92,
        timestamp: new Date('2024-01-01T10:00:00Z'),
        notes: 'First measurement',
      };

      const measurementData2: CreateMeasurementRequest = {
        weightLbs: 178,
        neckCm: 37.5,
        waistAtNavelCm: 91,
        timestamp: new Date('2024-01-02T10:00:00Z'),
        notes: 'Second measurement',
      };

      const res1 = await app.request('/api/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData1),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const response1 = await res1.json();
      measurement1 = response1.data;

      const res2 = await app.request('/api/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData2),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const response2 = await res2.json();
      measurement2 = response2.data;
    });

    it('should fetch all measurements for the user', async () => {
      const res = await app.request('/api/measurements', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      
      const data: ListMeasurementsResponse = responseData.data;
      expect(data.measurements).toHaveLength(2);
      expect(data.total).toBe(2);
      
      // Should be ordered by timestamp desc (most recent first)
      expect(data.measurements[0].notes).toBe('Second measurement');
      expect(data.measurements[1].notes).toBe('First measurement');
    });

    it('should filter measurements by date range', async () => {
      const res = await app.request('/api/measurements?startDate=2024-01-01T00:00:00Z&endDate=2024-01-01T23:59:59Z', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      const data: ListMeasurementsResponse = responseData.data;
      expect(data.measurements).toHaveLength(1);
      expect(data.measurements[0].notes).toBe('First measurement');
    });

    it('should support pagination', async () => {
      const res = await app.request('/api/measurements?limit=1&offset=0', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      const data: ListMeasurementsResponse = responseData.data;
      expect(data.measurements).toHaveLength(1);
      expect(data.total).toBe(2);
      expect(data.measurements[0].notes).toBe('Second measurement'); // Most recent first
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/measurements');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/measurements/:id', () => {
    let measurement: MeasurementResponse;

    beforeEach(async () => {
      const measurementData: CreateMeasurementRequest = {
        weightLbs: 180,
        neckCm: 38,
        waistAtNavelCm: 92,
        notes: 'Test measurement',
      };

      const res = await app.request('/api/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const response = await res.json();
      measurement = response.data;
    });

    it('should fetch a specific measurement', async () => {
      const res = await app.request(`/api/measurements/${measurement.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      expect(responseData.success).toBe(true);
      const fetchedMeasurement: MeasurementResponse = responseData.data;
      expect(fetchedMeasurement.id).toBe(measurement.id);
      expect(fetchedMeasurement.weightLbs).toBe(180);
      expect(fetchedMeasurement.notes).toBe('Test measurement');
    });

    it('should return 404 for non-existent measurement', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const res = await app.request(`/api/measurements/${fakeId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it('should require authentication', async () => {
      const res = await app.request(`/api/measurements/${measurement.id}`);

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/measurements/:id', () => {
    let measurement: MeasurementResponse;

    beforeEach(async () => {
      const measurementData: CreateMeasurementRequest = {
        weightLbs: 180,
        neckCm: 38,
        waistAtNavelCm: 92,
        notes: 'Original measurement',
      };

      const res = await app.request('/api/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const response = await res.json();
      measurement = response.data;
    });

    it('should update a measurement', async () => {
      const updateData: UpdateMeasurementRequest = {
        weightLbs: 175,
        neckCm: 37,
        waistAtNavelCm: 90,
        notes: 'Updated measurement',
      };

      const res = await app.request(`/api/measurements/${measurement.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      expect(responseData.success).toBe(true);
      const updatedMeasurement: MeasurementResponse = responseData.data;
      expect(updatedMeasurement.id).toBe(measurement.id);
      expect(updatedMeasurement.weightLbs).toBe(175);
      expect(updatedMeasurement.neckCm).toBe(37);
      expect(updatedMeasurement.waistCm).toBe(90);
      expect(updatedMeasurement.notes).toBe('Updated measurement');
    });

    it('should return 404 for non-existent measurement', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: UpdateMeasurementRequest = {
        weightLbs: 175,
      };

      const res = await app.request(`/api/measurements/${fakeId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it('should require authentication', async () => {
      const updateData: UpdateMeasurementRequest = {
        weightLbs: 175,
      };

      const res = await app.request(`/api/measurements/${measurement.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/measurements/:id', () => {
    let measurement: MeasurementResponse;

    beforeEach(async () => {
      const measurementData: CreateMeasurementRequest = {
        weightLbs: 180,
        notes: 'To be deleted',
      };

      const res = await app.request('/api/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const response = await res.json();
      measurement = response.data;
    });

    it('should delete a measurement', async () => {
      const res = await app.request(`/api/measurements/${measurement.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe(measurement.id);

      // Verify measurement is actually deleted
      const getRes = await app.request(`/api/measurements/${measurement.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent measurement', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const res = await app.request(`/api/measurements/${fakeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it('should require authentication', async () => {
      const res = await app.request(`/api/measurements/${measurement.id}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('Body fat calculations', () => {
    it('should calculate body fat for female users', async () => {
      // Create a female user
      const femaleUserData = {
        name: 'Jane Doe',
        email: getUniqueEmail('jane'),
        password: 'password123',
        heightCm: 165.0,
        sex: 'female' as const,
      };

      const userRes = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(femaleUserData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { token: femaleToken } = await userRes.json();

      const measurementData: CreateMeasurementRequest = {
        weightLbs: 140,
        neckCm: 32,
        waistAtNavelCm: 68,
        hipCm: 95,
      };

      const res = await app.request('/api/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${femaleToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      const measurement: MeasurementResponse = responseData.data;
      expect(measurement.bodyFatPercentage).not.toBeNull();
      expect(typeof measurement.bodyFatPercentage).toBe('number');
      expect(measurement.hipCm).toBe(95);
    });

    it('should not calculate body fat without required measurements', async () => {
      const measurementData: CreateMeasurementRequest = {
        weightLbs: 180,
        // Missing neck and waist measurements
      };

      const res = await app.request('/api/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      const measurement: MeasurementResponse = responseData.data;
      expect(measurement.bodyFatPercentage).toBeNull();
    });

    it('should not calculate body fat for user without height or sex', async () => {
      // Create a user without height and sex
      const incompleteUserData = {
        name: 'Incomplete User',
        email: getUniqueEmail('incomplete'),
        password: 'password123',
      };

      const userRes = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(incompleteUserData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { token: incompleteToken } = await userRes.json();

      const measurementData: CreateMeasurementRequest = {
        weightLbs: 180,
        neckCm: 38,
        waistAtNavelCm: 92,
      };

      const res = await app.request('/api/measurements', {
        method: 'POST',
        body: JSON.stringify(measurementData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${incompleteToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      const measurement: MeasurementResponse = responseData.data;
      expect(measurement.bodyFatPercentage).toBeNull();
    });
  });
});
