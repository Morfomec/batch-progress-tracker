import { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const { isDarkMode } = useTheme();

    const handleReset = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        try {
            const actionCodeSettings = {
                url: `${window.location.origin}/auth/action?mode=resetPassword`,
                handleCodeInApp: true
            };
            await sendPasswordResetEmail(auth, email, actionCodeSettings);
            setSubmitted(true);
            toast.success("Password reset email sent!");
        } catch (err) {
            toast.error(err.message || "Failed to send reset email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-white/5 p-8 relative z-10 animate-fadeIn transition-colors duration-300">
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Link>

                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6">
                    <KeyRound className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                    Forgot Password?
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Enter your email address to receive a password reset link.
                </p>

                {submitted ? (
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-6 text-center animate-fadeIn">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Check your inbox</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">We have sent a password reset link to <span className="font-semibold">{email}</span></p>
                        <button
                            onClick={() => setSubmitted(false)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold text-sm transition-colors"
                        >
                            Try another email
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-6">
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
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all duration-200"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? "Sending link..." : "Send Reset Link"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
