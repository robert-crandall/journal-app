import { apiFetch } from '../api';
import type { TimeframeExportRequest, TimeframeExportResponse } from '../../../shared/types/timeframe-export';

// Type-safe timeframe export API using fetch wrapper
export const timeframeExportApi = {
  // Generate timeframe export
  async generateExport(data: TimeframeExportRequest): Promise<TimeframeExportResponse> {
    const response = await apiFetch('/api/timeframe-export/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate timeframe export');
    }

    const result = await response.json();
    return result.data;
  },
};