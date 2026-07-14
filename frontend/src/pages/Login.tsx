import React, { useState } from "react";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login Flow
        const res = await axios.post(
          "http://localhost:8000/api/v1/auth/login",
          {
            email,
            password,
          },
        );

        setAuth(res.data.user, res.data.access_token);
        navigate("/dashboard");
      } else {
        // Signup Flow
        await axios.post("http://localhost:8000/api/v1/auth/signup", {
          name,
          email,
          password,
        });

        setSuccessMsg(
          "A verification email has been sent. Please check your inbox to activate your account.",
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white font-sans flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Video (Matching Landing Page) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-30 mix-blend-screen"
      >
        <source src="/back.mp4" type="video/mp4" />
      </video>

      {/* Gradient Overlay for better readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0a0b0e]/80 via-transparent to-[#0a0b0e] z-0 pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity"
        >
          <h2 className="text-[white] font-black text-3xl tracking-tighter uppercase">
            Ai0ps
          </h2>
          <span className="bg-[white]/10 text-[white] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[white]/30">
            SECURE LOGIN
          </span>
        </Link>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white uppercase drop-shadow-lg">
          {isLogin ? "Authenticate Access" : "Initialize Account"}
        </h2>
        <p className="mt-2 text-sm text-[#888888] font-light">
          {isLogin ? "Or " : "Already provisioned? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccessMsg("");
            }}
            className="font-bold text-[white] uppercase tracking-widest text-[10px] hover:text-[#ffff33] transition-colors ml-1"
          >
            {isLogin ? "register new identity" : "sign in instead"}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#121318]/80 backdrop-blur-xl py-8 px-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-[white]/10 sm:rounded sm:px-10">
          {error && (
            <div className="mb-4 bg-red-900/40 border border-red-500/50 rounded p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-[#ffff33]/10 border border-[#ffff33]/50 rounded p-3 text-sm text-[#ffff33]">
              {successMsg}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1">
                  Full Name
                </label>
                <div className="relative rounded shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-[#888888]" />
                  </div>
                  <input
                    type="text"
                    required={!isLogin}
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 bg-black/50 border border-[white]/20 rounded py-3 text-white placeholder-[#444] focus:ring-0 focus:border-[white] transition-all text-sm font-light"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1">
                Email Address
              </label>
              <div className="relative rounded shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[#888888]" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 bg-black/50 border border-[white]/20 rounded py-3 text-white placeholder-[#444] focus:ring-0 focus:border-[white] transition-all text-sm font-light"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-1">
                Security Key
              </label>
              <div className="relative rounded shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[#888888]" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 bg-black/50 border border-[white]/20 rounded py-3 text-white placeholder-[#444] focus:ring-0 focus:border-[white] transition-all text-sm font-light"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-4 px-4 border border-[white]/50 rounded text-xs font-black uppercase tracking-widest text-[white] bg-[white]/5 hover:bg-[white]/10 focus:outline-none focus:ring-0 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? "Execute Login" : "Provision Account"}
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
