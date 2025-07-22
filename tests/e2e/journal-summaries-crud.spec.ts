import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

test.describe('Journal Summaries CRUD', () => {
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.waitForLoadState('networkidle');
    
    // Get auth token for API calls
    authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
    expect(authToken).toBeTruthy();
  });

  async function cleanupSummaries(page: any) {
    try {
      const response = await page.request.get('http://localhost:3001/api/journal-summaries', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      if (response.ok()) {
        const data = await response.json();
        if (data.success && data.data.summaries) {
          for (const summary of data.data.summaries) {
            await page.request.delete(`http://localhost:3001/api/journal-summaries/${summary.id}`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
          }
        }
      }
    } catch (error) {
      // Ignore cleanup errors
      console.log('Cleanup error (ignoring):', error);
    }
  }

  test('should create a new journal summary', async ({ page }) => {
    await cleanupSummaries(page);

    // Test CREATE
    const createResponse = await page.request.post('http://localhost:3001/api/journal-summaries', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        period: 'week',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'Test weekly summary for CRUD testing',
        tags: ['test', 'crud'],
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const createData = await createResponse.json();
    expect(createData.success).toBe(true);
    expect(createData.data.id).toBeTruthy();
    expect(createData.data.summary).toBe('Test weekly summary for CRUD testing');
  });

  test('should read (list) journal summaries', async ({ page }) => {
    await cleanupSummaries(page);

    // Create a test summary first
    await page.request.post('http://localhost:3001/api/journal-summaries', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        period: 'week',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'Summary for read test',
        tags: ['read-test'],
      },
    });

    // Test READ (list)
    const listResponse = await page.request.get('http://localhost:3001/api/journal-summaries', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(listResponse.ok()).toBeTruthy();
    const listData = await listResponse.json();
    expect(listData.success).toBe(true);
    expect(listData.data.summaries.length).toBeGreaterThan(0);
    expect(listData.data.summaries[0].summary).toBe('Summary for read test');
  });

  test('should read a single journal summary', async ({ page }) => {
    await cleanupSummaries(page);

    // Create a test summary first
    const createResponse = await page.request.post('http://localhost:3001/api/journal-summaries', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        period: 'week',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'Summary for single read test',
        tags: ['single-read'],
      },
    });

    const createData = await createResponse.json();
    const summaryId = createData.data.id;

    // Test READ (single)
    const getResponse = await page.request.get(`http://localhost:3001/api/journal-summaries/${summaryId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(getResponse.ok()).toBeTruthy();
    const getData = await getResponse.json();
    expect(getData.success).toBe(true);
    expect(getData.data.id).toBe(summaryId);
    expect(getData.data.summary).toBe('Summary for single read test');
  });

  test('should update a journal summary', async ({ page }) => {
    await cleanupSummaries(page);

    // Create a test summary first
    const createResponse = await page.request.post('http://localhost:3001/api/journal-summaries', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        period: 'week',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'Original summary',
        tags: ['original'],
      },
    });

    const createData = await createResponse.json();
    const summaryId = createData.data.id;

    // Test UPDATE
    const updateResponse = await page.request.put(`http://localhost:3001/api/journal-summaries/${summaryId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        summary: 'Updated summary content',
        tags: ['updated', 'modified'],
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updateData = await updateResponse.json();
    expect(updateData.success).toBe(true);
    expect(updateData.data.summary).toBe('Updated summary content');
    expect(updateData.data.tags).toEqual(['updated', 'modified']);
  });

  test('should delete a journal summary', async ({ page }) => {
    await cleanupSummaries(page);

    // Create a test summary first
    const createResponse = await page.request.post('http://localhost:3001/api/journal-summaries', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        period: 'week',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'Summary to be deleted',
        tags: ['delete-test'],
      },
    });

    const createData = await createResponse.json();
    const summaryId = createData.data.id;

    // Test DELETE
    const deleteResponse = await page.request.delete(`http://localhost:3001/api/journal-summaries/${summaryId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(deleteResponse.ok()).toBeTruthy();
    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);

    // Verify it's deleted by trying to fetch it
    const getResponse = await page.request.get(`http://localhost:3001/api/journal-summaries/${summaryId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(getResponse.ok()).toBeFalsy();
    expect(getResponse.status()).toBe(404);
  });

  test('should complete full CRUD cycle', async ({ page }) => {
    await cleanupSummaries(page);

    // CREATE
    const createResponse = await page.request.post('http://localhost:3001/api/journal-summaries', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        period: 'month',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        summary: 'Full CRUD cycle test summary',
        tags: ['crud', 'cycle', 'test'],
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const createData = await createResponse.json();
    const summaryId = createData.data.id;

    // READ
    const readResponse = await page.request.get(`http://localhost:3001/api/journal-summaries/${summaryId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(readResponse.ok()).toBeTruthy();
    const readData = await readResponse.json();
    expect(readData.data.summary).toBe('Full CRUD cycle test summary');

    // UPDATE
    const updateResponse = await page.request.put(`http://localhost:3001/api/journal-summaries/${summaryId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        summary: 'Updated CRUD cycle summary',
        tags: ['updated', 'crud'],
      },
    });
    expect(updateResponse.ok()).toBeTruthy();

    // Verify UPDATE
    const verifyResponse = await page.request.get(`http://localhost:3001/api/journal-summaries/${summaryId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const verifyData = await verifyResponse.json();
    expect(verifyData.data.summary).toBe('Updated CRUD cycle summary');

    // DELETE
    const deleteResponse = await page.request.delete(`http://localhost:3001/api/journal-summaries/${summaryId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(deleteResponse.ok()).toBeTruthy();

    // Verify DELETE
    const finalResponse = await page.request.get(`http://localhost:3001/api/journal-summaries/${summaryId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(finalResponse.status()).toBe(404);
  });
});
