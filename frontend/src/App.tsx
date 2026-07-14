import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "./pages/Dashboard";
import { LandingPage } from "./pages/LandingPage";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import { LogAnalytics } from "./pages/LogAnalytics";
import { RootCauseAnalysis } from "./pages/RootCauseAnalysis";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/log-analytics" element={<LogAnalytics />} />
          <Route path="/rca/:anomalyId" element={<RootCauseAnalysis />} />
          <Route path="/rca" element={<RootCauseAnalysis />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
