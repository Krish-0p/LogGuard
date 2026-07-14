import { apiClient } from "./client";
import type {
  AnomalyScore,
  AnomalyTimelineBucket,
  RcaResult,
} from "../types/anomaly";

export interface AnomalyListParams {
  host?: string;
  from_time?: string;
  to_time?: string;
  min_score?: number;
  limit?: number;
}

export const anomaliesApi = {
  list: async (
    params: AnomalyListParams,
  ): Promise<{ anomalies: AnomalyScore[]; count: number }> => {
    const { data } = await apiClient.get("/anomalies/", { params });
    return data;
  },

  timeline: async (params: {
    host?: string;
    bucket_minutes?: number;
    hours_back?: number;
  }): Promise<{ timeline: AnomalyTimelineBucket[] }> => {
    const { data } = await apiClient.get("/anomalies/timeline", { params });
    return data;
  },

  getRca: async (
    anomalyId: number,
  ): Promise<{ anomaly_id: number; rca: RcaResult }> => {
    const { data } = await apiClient.get(`/anomalies/${anomalyId}/rca`);
    return data;
  },
};
