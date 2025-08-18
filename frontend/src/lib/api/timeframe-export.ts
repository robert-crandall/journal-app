import { apiFetch } from '../api';
import type { TimeframeExportRequest, TimeframeExportResponse } from '../../../../shared/types/timeframe-export';

// Type-safe timeframe export API using fetch wrapper
export const timeframeExportApi = {
  // Generate timeframe export
  async generateExport(data: TimeframeExportRequest): Promise<TimeframeExportResponse> {
    const result = await apiFetch('/api/timeframe-export/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return result.data;
  },
};
