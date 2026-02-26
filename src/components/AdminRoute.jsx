import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default AdminRoute;
