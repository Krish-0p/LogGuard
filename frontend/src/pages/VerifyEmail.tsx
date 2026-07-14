import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { ShieldCheck, XCircle } from "lucide-react";

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await axios.post(
          "http://localhost:8000/api/v1/auth/verify-email",
          { token },
        );

        setStatus("success");
        setMessage("Email verified successfully! Logging you in...");

        // Log them in immediately after verification
        setTimeout(() => {
          setAuth(res.data.user, res.data.access_token);
          navigate("/dashboard");
        }, 2000);
      } catch (err: any) {
        console.error(err);
        setStatus("error");
        setMessage(
          err.response?.data?.detail ||
            "Verification failed. The link might be expired.",
        );
      }
    };

    verifyToken();
  }, [token, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#111827]/80 backdrop-blur-xl py-12 px-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-gray-800/50 sm:rounded-2xl sm:px-10 text-center flex flex-col items-center">
          {status === "loading" && (
            <>
              <svg
                className="animate-spin h-12 w-12 text-blue-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <h2 className="text-2xl font-bold text-white mb-2">
                Verifying Email...
              </h2>
              <p className="text-gray-400">
                Please wait while we confirm your email address.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <ShieldCheck className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
              <p className="text-green-400 mb-6">{message}</p>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-[#111827] transition-all"
              >
                Go to Dashboard
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Verification Failed
              </h2>
              <p className="text-red-400 mb-6">{message}</p>
              <button
                onClick={() => navigate("/login")}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-[#111827] transition-all"
              >
                Return to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
