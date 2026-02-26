import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function JoinGroup() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);

        try {
            const q = query(
                collection(db, "groups"),
                where("groupCode", "==", code.toUpperCase())
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                toast.error("No batch found with this code. Please check and try again.");
                setLoading(false);
                return;
            }

            const groupDoc = snapshot.docs[0];

            await updateDoc(doc(db, "groups", groupDoc.id), {
                members: arrayUnion(user.uid)
            });

            // Redirect to dashboard immediately after joining
            toast.success("Successfully joined the batch!");
            navigate("/dashboard");
        } catch (err) {
            toast.error(err.message || "Failed to join batch");
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 min-h-[calc(100vh-80px)] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-sky-500/10 dark:bg-sky-500/5 rounded-full blur-[100px]" />
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 p-8 relative z-10 animate-fadeIn transition-colors duration-300">

                <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6">
                    <LogIn className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                    Join a Batch
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Enter the 6-character code provided by your batch admin to join.
                </p>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">Batch Code</label>
                        <input
                            type="text"
                            placeholder="e.g. X7F9PQ"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase());
                            }}
                            maxLength={6}
                            className={`w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono text-center tracking-[0.5em] text-lg uppercase focus:outline-none focus:ring-2 transition-all duration-200 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/50 dark:focus:border-indigo-500`}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || code.length < 6}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Joining...
                            </>
                        ) : "Join Batch"}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Want to start your own batch?{" "}
                        <Link to="/create-group" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium hover:underline">
                            Create one here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default JoinGroup;