import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Ban, LogOut } from "lucide-react";
import { auth } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";

function ProtectedRoute({ children }) {
    const { user, userProfile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" />;
    }

    if (user && !userProfile && location.pathname !== "/profile-setup") {
        return <Navigate to="/profile-setup" />;
    }

    if (userProfile?.isBlocked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-rose-100 dark:border-rose-900/30 p-8 sm:p-12 max-w-md w-full text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6">
                        <Ban className="w-10 h-10 text-rose-600 dark:text-rose-500" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-4 tracking-tight">Account Suspended</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                        Your account has been temporarily blocked by the administrator. You no longer have access to the platform.
                    </p>
                    <button
                        onClick={() => signOut(auth)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20"
                    >
                        <LogOut className="w-5 h-5" />
                        Log Out
                    </button>
                </div>
            </div>
        );
    }

    return children;
}

export default ProtectedRoute;