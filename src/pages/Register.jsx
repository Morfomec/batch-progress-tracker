import { useState } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, UserPlus, Eye, EyeOff, CheckCircle2, Sun, Moon, Phone, MessageSquare } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

function Register() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [authMode, setAuthMode] = useState("email");

  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const MIN_PASSWORD_LENGTH = 6;

  // ================= PASSWORD STRENGTH =================
  const getPasswordStrength = (password) => {
    if (!password) return { label: "", score: 0 };

    let score = 0;
    if (password.length >= 6) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^A-Za-z0-9]/)) score++;

    if (score <= 1) return { label: "Weak", score: 1 };
    if (score <= 3) return { label: "Good", score: 2 };
    return { label: "Strong", score: 3 };
  };

  const strengthData = getPasswordStrength(password);

  const strengthColors = {
    0: "bg-slate-200 dark:bg-slate-700",
    1: "bg-red-500",
    2: "bg-amber-500",
    3: "bg-emerald-500"
  };

  // ================= VALIDATION =================
  const validate = () => {
    if (!email) return "Email is required";
    if (password.length < MIN_PASSWORD_LENGTH)
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    if (password !== confirmPassword)
      return "Passwords do not match";
    return "";
  };

  const formError = validate();
  const isFormValid = !formError;

  // ================= REGISTER =================
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error(formError);
      return;
    }

    setLoading(true);

    const trimmedEmail = email.trim();

    try {
      await createUserWithEmailAndPassword(auth, trimmedEmail, password);

      const actionCodeSettings = {
        url: `${window.location.origin}/auth/action?mode=verifyEmail`,
        handleCodeInApp: true
      };

      await sendEmailVerification(auth.currentUser, actionCodeSettings);
      await auth.signOut();

      setIsRegistered(true);
      toast.success("Account created successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          fullName: user.displayName || "Google User",
          nickName: user.displayName ? user.displayName.split(" ")[0] : "User",
          email: user.email,
          createdAt: serverTimestamp(),
          themePreference: "system",
          privacyMode: false,
        });
      }

      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-300">

      {/* ================= LEFT SIDE (VISUAL / DESIGN) ================= */}
      <div className="hidden lg:flex w-[45%] relative overflow-hidden bg-indigo-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 items-center justify-center text-slate-900 dark:text-white transition-colors duration-300">

        {/* Premium Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-100 via-white to-indigo-100 dark:from-purple-900 dark:via-slate-900 dark:to-indigo-900 opacity-90 transition-colors duration-300" />

        {/* Animated Orbs */}
        <div className="absolute top-[10%] left-[10%] w-[30vw] h-[30vw] bg-indigo-400/20 dark:bg-indigo-500/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-float transition-colors duration-300" style={{ animationDuration: '14s' }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-fuchsia-400/20 dark:bg-fuchsia-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-float transition-colors duration-300" style={{ animationDuration: '18s', animationDelay: '2s' }} />

        {/* Glassmorphism Content Card */}
        <div className="relative z-10 w-full max-w-lg p-12 rounded-[2rem] bg-white/40 dark:bg-transparent backdrop-blur-xl dark:backdrop-blur-none border border-white/40 dark:border-transparent">
          <div className="w-16 h-16 bg-white/60 dark:bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/60 dark:border-white/20 shadow-sm dark:shadow-none">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-5xl font-bold leading-tight mb-6 text-slate-900 dark:text-white">
            Start your journey <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-300 dark:to-indigo-300">
              to the top.
            </span>
          </h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-md">
            Create an account to track your study progress, compare metrics with friends, and hit your milestones every single week.
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span>Detailed weekly analytics</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span>Private batch leaderboards</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span>Automated scoring system</span>
            </div>
          </div>
        </div>

      </div>

      {/* ================= RIGHT SIDE (FORM / SUCCESS) ================= */}
      <div className="w-full lg:w-[55%] bg-white dark:bg-slate-900 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 transition-colors duration-300">

        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white">BatchTracker</span>
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-8 right-8 sm:right-16 lg:right-24 xl:right-32">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="w-full max-w-md mx-auto animate-fadeIn mt-12 lg:mt-0">

          {isRegistered ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-emerald-500" />
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                Verify your email
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-8">
                We've sent a verification link to <span className="font-semibold text-slate-900 dark:text-white">{email}</span>.
                Please check your inbox and click the link to activate your account.
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-8 text-left">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Didn't receive the email?
                </h3>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 ml-4 list-disc">
                  <li>Check your spam or junk folder</li>
                  <li>Verify that your email was typed correctly</li>
                  <li>Wait a few minutes, sometimes emails are delayed</li>
                </ul>
              </div>

              <button
                onClick={() => navigate("/")}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                  Create account
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                  Sign up in seconds to get started.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">

                {/* EMAIL */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1 h-1.5">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`h-full flex-1 rounded-full transition-colors duration-300 ${strengthData.score >= level ? strengthColors[strengthData.score] : "bg-slate-200 dark:bg-slate-700"
                              }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-right">
                        {strengthData.label} password
                      </p>
                    </div>
                  )}
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all duration-200 ${confirmPassword && password !== confirmPassword
                        ? "border-red-300 dark:border-red-500/50 focus:ring-red-500/50"
                        : "border-slate-200 dark:border-slate-700 focus:ring-indigo-500/50"
                        }`}
                      required
                    />
                  </div>
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 transition-all duration-300 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    "Creating account..."
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Sign up
                    </>
                  )}
                </button>

              </form>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">or sign up with</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={handleGoogleSignUp}
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
              </div>

              <p className="text-center text-slate-600 dark:text-slate-400 mt-8 font-medium">
                Already have an account?{" "}
                <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-all">
                  Sign in
                </Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default Register;