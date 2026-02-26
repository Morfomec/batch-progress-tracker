import { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, LogIn, ArrowRight, Sun, Moon, Phone, MessageSquare } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState("email"); // email, phone, phone-otp
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        await auth.signOut();
        toast.error("Please verify your email before logging in. Check your inbox.");
        return;
      }

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setupRecaptcha();
      const formatPhone = phoneNumber.startsWith('+') ? phoneNumber : '+1' + phoneNumber;
      const confirmation = await signInWithPhoneNumber(auth, formatPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      toast.success("OTP sent successfully!");
      setAuthMode("phone-otp");
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await confirmationResult.confirm(otp);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-300">

      {/* ================= LEFT SIDE (LOGIN FORM) ================= */}
      <div className="w-full lg:w-[45%] bg-white dark:bg-slate-900 flex flex-col justify-center px-8 sm:px-16 lg:px-24 relative z-10 shadow-2xl transition-colors duration-300">

        {/* Logo / Brand Name */}
        <div className="absolute top-8 left-8 sm:left-16 lg:left-24 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">BatchTracker</span>
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-8 right-8 sm:right-16 lg:right-24">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="w-full max-w-md mx-auto animate-fadeIn">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Welcome back
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              {authMode === "email" && "Please enter your details to sign in."}
              {authMode === "phone" && "Enter your phone number to sign in."}
              {authMode === "phone-otp" && "Enter the verification code."}
            </p>
          </div>

          {authMode === "email" && (
            <form onSubmit={handleLogin} className="space-y-6">

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

            </form>
          )}

          {authMode === "email" && (
            <>
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">or continue with</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button
                  onClick={() => setAuthMode("phone")}
                  disabled={loading}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5 text-indigo-500" />
                  Phone
                </button>
              </div>
            </>
          )}

          {authMode === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm font-medium border border-red-100 dark:border-red-900/30 animate-pulse">
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? "Sending Code..." : "Send Verification Code"}
              </button>
              <button type="button" onClick={() => { setAuthMode("email"); setError(""); }} className="w-full text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-center transition-colors">
                Back to Email Login
              </button>
            </form>
          )}

          {authMode === "phone-otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                  Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MessageSquare className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm font-medium border border-red-100 dark:border-red-900/30 animate-pulse">
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>
              <button type="button" onClick={() => { setAuthMode("email"); setError(""); }} className="w-full text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-center transition-colors">
                Cancel
              </button>
            </form>
          )}

          <div id="recaptcha-container"></div>

          {/* Footer */}
          <p className="text-center text-slate-600 dark:text-slate-400 mt-8 font-medium">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-all">
              Sign up for free
            </Link>
          </p>

        </div>
      </div>

      {/* ================= RIGHT SIDE (VISUAL / DESIGN) ================= */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-indigo-50 dark:bg-slate-900 items-center justify-center text-slate-900 dark:text-white transition-colors duration-300">

        {/* Premium Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-indigo-900 dark:via-slate-900 dark:to-purple-900 opacity-90 transition-colors duration-300" />

        {/* Animated Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-400/20 dark:bg-indigo-500/30 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-float transition-colors duration-300" style={{ animationDuration: '15s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-400/20 dark:bg-purple-500/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-float transition-colors duration-300" style={{ animationDuration: '20s', animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[20%] w-[30vw] h-[30vw] bg-blue-400/10 dark:bg-blue-500/20 rounded-full blur-[90px] mix-blend-multiply dark:mix-blend-screen animate-float transition-colors duration-300" style={{ animationDuration: '12s', animationDelay: '1s' }} />

        {/* Glassmorphism Content Card */}
        <div className="relative z-10 w-full max-w-lg p-12 rounded-[2rem] bg-white/40 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/20 shadow-2xl transition-colors duration-300">
          <div className="w-16 h-16 bg-white/60 dark:bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
            <LogIn className="h-8 w-8 text-indigo-600 dark:text-white" />
          </div>
          <h2 className="text-5xl font-bold leading-tight mb-6 text-slate-900 dark:text-white">
            Track your batch <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-300 dark:to-purple-300">
              progress seamlessly.
            </span>
          </h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            Join your peers, monitor your performance, update your weekly tasks, and stay competitive on the leaderboard.
          </p>

          {/* Mock UI Element */}
          <div className="mt-10 p-5 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 flex items-center gap-4 shadow-sm dark:shadow-none">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-green-400 to-emerald-500 flex items-center justify-center border-2 border-white/60 dark:border-white/20">
              <span className="font-bold text-white text-sm">98</span>
            </div>
            <div>
              <p className="text-slate-900 dark:text-white font-medium">Top Performer</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">You are leading the batch!</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Login;