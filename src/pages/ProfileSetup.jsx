import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { User, CheckCircle2 } from "lucide-react";

function ProfileSetup() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [nickName, setNickName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fullName || !nickName) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await setDoc(doc(db, "users", user.uid), {
                fullName,
                nickName,
                email: user.email,
                createdAt: serverTimestamp(),
                themePreference: "system",
                privacyMode: false,
            });
            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">

            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/10 rounded-full blur-[100px] animate-float pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-500/10 rounded-full blur-[120px] animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

            <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 relative z-10 transition-colors duration-300">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100 dark:border-indigo-800">
                    <User className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Welcome!</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Let's set up your profile before you enter the dashboard.
                </p>

                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                        <input
                            type="text"
                            placeholder="e.g. John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nick Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Johnny"
                            value={nickName}
                            onChange={(e) => setNickName(e.target.value)}
                            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                            required
                        />
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            This name will be visible to your batch mates on the leaderboard.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 mt-4 rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? "Saving..." : (
                            <>
                                Continue to Dashboard
                                <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProfileSetup;
