import { apiClient } from "./client";
import type { FeedbackPayload } from "../types/anomaly";

export const feedbackApi = {
  submit: async (payload: FeedbackPayload): Promise<any> => {
    const { data } = await apiClient.post("/feedback/", payload);
    return data;
  },
};
