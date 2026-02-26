import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

    return children;
}

export default ProtectedRoute;