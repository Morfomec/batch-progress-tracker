import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Users, Copy, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

function CreateGroup() {
    const [groupName, setGroupName] = useState("");
    const [loading, setLoading] = useState(false);
    const [createdCode, setCreatedCode] = useState(null);
    const [copied, setCopied] = useState(false);
    const { user } = useAuth();

    const generateUniqueCode = async () => {
        let code;
        let exists = true;

        while (exists) {
            code = Math.random().toString(36).substring(2, 8).toUpperCase();

            const q = query(
                collection(db, "groups"),
                where("groupCode", "==", code)
            );

            const snapshot = await getDocs(q);
            exists = !snapshot.empty;
        }
        return code;
    }

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return;

        setLoading(true);
        try {
            const groupCode = await generateUniqueCode();

            await addDoc(collection(db, "groups"), {
                groupName,
                groupCode,
                ownerId: user.uid,
                members: [user.uid],
                createdAt: new Date()
            });

            setCreatedCode(groupCode);
            toast.success("Batch created successfully!");
        } catch (error) {
            toast.error(error.message || "Failed to create batch");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(createdCode);
        setCopied(true);
        toast.success("Batch code copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex-1 min-h-[calc(100vh-80px)] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px]" />
            <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-white/5 p-8 relative z-10 animate-fadeIn transition-colors duration-300">

                <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6">
                    <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                    Create a Batch
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Start a new learning group and invite your peers to track progress together.
                </p>

                {createdCode ? (
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6 text-center animate-fadeIn">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Batch Created Successfully!</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Share this code with your members to let them join.</p>

                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-sm dark:shadow-none mb-6">
                            <span className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100 tracking-widest">{createdCode}</span>
                            <button
                                onClick={copyToClipboard}
                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                title="Copy code"
                            >
                                {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>

                        <Link
                            to="/dashboard"
                            className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-none"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">Batch Name</label>
                            <input
                                type="text"
                                placeholder="e.g. React Mastery Alpha"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all duration-200"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !groupName.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating..." : "Create Batch"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default CreateGroup;