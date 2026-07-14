import { create } from "zustand";
import type { AnomalyScore } from "../types/anomaly";

const MAX_FEED_SIZE = 100; // Keep last 100 real-time anomalies

interface LiveFeedStore {
  anomalies: AnomalyScore[];
  isConnected: boolean;
  unreadCount: number;
  addAnomaly: (anomaly: AnomalyScore) => void;
  setConnected: (status: boolean) => void;
  markAllRead: () => void;
  clearFeed: () => void;
}

export const useLiveFeedStore = create<LiveFeedStore>((set) => ({
  anomalies: [],
  isConnected: false,
  unreadCount: 0,

  addAnomaly: (anomaly) =>
    set((state) => ({
      anomalies: [anomaly, ...state.anomalies].slice(0, MAX_FEED_SIZE),
      unreadCount: state.unreadCount + 1,
    })),

  setConnected: (isConnected) => set({ isConnected }),

  markAllRead: () => set({ unreadCount: 0 }),

  clearFeed: () => set({ anomalies: [], unreadCount: 0 }),
}));
