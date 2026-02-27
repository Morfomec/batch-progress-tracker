import { useState, useEffect } from "react";
import { auth } from "../firebase/firebaseConfig";
import { verifyPasswordResetCode, confirmPasswordReset, applyActionCode } from "firebase/auth";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { KeyRound, MailCheck, ShieldAlert, ArrowRight, Home, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

function AuthAction() {
    const [mode, setMode] = useState(null);
    const [oobCode, setOobCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionStatus, setActionStatus] = useState("processing"); // processing, success, error
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { isDarkMode, toggleTheme } = useTheme();

    useEffect(() => {
        // Parse the query parameters
        const queryParams = new URLSearchParams(location.search);
        const modeParam = queryParams.get("mode");
        const oobCodeParam = queryParams.get("oobCode");

        if (!modeParam || !oobCodeParam) {
            setActionStatus("error");
            setLoading(false);
            return;
        }

        setMode(modeParam);
        setOobCode(oobCodeParam);

        // If it's a verifyEmail action, handle it immediately
        if (modeParam === "verifyEmail") {
            handleVerifyEmail(oobCodeParam);
        } else if (modeParam === "resetPassword") {
            // For resetPassword, we just verify the code first
            handleVerifyResetCode(oobCodeParam);
        } else {
            // Unknown mode (recoverEmail etc. not implemented here)
            setActionStatus("error");
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    const handleVerifyEmail = async (code) => {
        try {
            await applyActionCode(auth, code);
            setActionStatus("success");
            toast.success("Email verified successfully!");
        } catch (error) {
            console.error(error);
            setActionStatus("error");
            toast.error("Invalid or expired verification link.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyResetCode = async (code) => {
        try {
            const email = await verifyPasswordResetCode(auth, code);
            setEmail(email);
            setActionStatus("processing"); // Ready for user to input new password
            setLoading(false);
        } catch (error) {
            console.error(error);
            setActionStatus("error");
            toast.error("Invalid or expired reset link.");
            setLoading(false);
        }
    };

    const handleSetNewPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setActionStatus("success");
            toast.success("Password changed successfully!");
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Error State Layout
    if (actionStatus === "error") {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 text-center animate-fadeIn">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Invalid Link</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        This link may have expired or has already been used. Please request a new one.
                    </p>
                    <Link
                        to="/"
                        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                        <Home className="w-5 h-5" />
                        Go to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    // Success State Layout
    if (actionStatus === "success") {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="absolute top-8 right-8">
                    <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>

                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 text-center animate-fadeIn">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        {mode === "verifyEmail" ? (
                            <MailCheck className="w-8 h-8 text-emerald-500" />
                        ) : (
                            <KeyRound className="w-8 h-8 text-emerald-500" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {mode === "verifyEmail" ? "Email Verified!" : "Password Changed!"}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        {mode === "verifyEmail"
                            ? "Your email address has been successfully verified."
                            : "You can now sign in with your new password."}
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                        Sign In Now
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    // Processing State - Reset Password Form Layout
    if (mode === "resetPassword" && actionStatus === "processing") {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="absolute top-8 right-8">
                    <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>

                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 animate-fadeIn">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6">
                        <KeyRound className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Reset Password</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                        Create a new password for <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
                    </p>

                    <form onSubmit={handleSetNewPassword} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">New Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                required
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                id="showPassword"
                                type="checkbox"
                                checked={showPassword}
                                onChange={() => setShowPassword(!showPassword)}
                                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                            />
                            <label htmlFor="showPassword" className="ml-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                                Show passwords
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !newPassword || !confirmPassword}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return null;
}

export default AuthAction;
