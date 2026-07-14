import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLiveFeedStore } from "../store/useLiveFeedStore";
import type { AnomalyScore } from "../types/anomaly";

const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/anomalies";
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();
  const attemptsRef = useRef(0);

  const queryClient = useQueryClient();
  const { addAnomaly, setConnected } = useLiveFeedStore();

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log("🟢 WebSocket connected");
      setConnected(true);
      attemptsRef.current = 0;
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "anomaly") {
          const raw = msg.data;
          const anomaly: AnomalyScore = {
            id:
              typeof raw.anomaly_id === "string"
                ? parseInt(raw.anomaly_id, 10)
                : raw.anomaly_id || 0,
            scored_at: raw.timestamp || new Date().toISOString(),
            host: raw.host,
            tenant_id: raw.tenant_id,
            final_score: raw.final_score,
            if_score: raw.breakdown?.if_normalized || 0,
            lstm_score: raw.breakdown?.lstm_normalized || 0,
            is_anomaly: raw.final_score > 0.5,
            anomaly_type: null,
            log_volume: null,
            error_rate: raw.error_rate || null,
            feature_window_start: null,
            feature_window_end: null,
            log_text: raw.log_text || null,
            log_problem: raw.log_problem || null,
          };

          // 1. Add to real-time live feed (Zustand store)
          addAnomaly(anomaly);

          // Note: TanStack queries auto-poll every 3s now to prevent cancellation loops

          // 3. Browser notification if tab is in background
          if (
            document.visibilityState === "hidden" &&
            anomaly.final_score >= 0.85
          ) {
            new Notification("Ai0ps Alert", {
              body: `High anomaly on ${anomaly.host} (score: ${Math.round(anomaly.final_score * 100)}%)`,
              icon: "/favicon.svg",
            });
          }
        }

        if (event.data === "ping") {
          socket.send("pong");
        }
      } catch (e) {
        console.error("WS message parse error:", e);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      console.warn("🔴 WebSocket disconnected");

      if (attemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        attemptsRef.current++;
        console.log(
          `Reconnecting in ${RECONNECT_DELAY_MS}ms (attempt ${attemptsRef.current})...`,
        );
        reconnectRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      socket.close();
    };

    ws.current = socket;
  }, [queryClient, addAnomaly, setConnected]);

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    connect();

    return () => {
      clearTimeout(reconnectRef.current);
      ws.current?.close();
    };
  }, [connect]);
}
