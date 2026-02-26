import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { User, Save, Link as LinkIcon, Camera } from "lucide-react";

function MyProfile() {
    const { user, userProfile } = useAuth();

    const [fullName, setFullName] = useState("");
    const [nickName, setNickName] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (userProfile) {
            setFullName(userProfile.fullName || "");
            setNickName(userProfile.nickName || "");
        }
    }, [userProfile]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg("");

        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                fullName,
                nickName,
            });

            setSuccessMsg("Profile updated successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">

                        {/* Avatar / Photo Upload Area */}
                        <div className="relative group">
                            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white/20 bg-indigo-900/50 flex items-center justify-center text-4xl font-bold shadow-xl overflow-hidden backdrop-blur-md">
                                {userProfile?.photoURL ? (
                                    <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span>
                                        {userProfile?.nickName
                                            ? userProfile.nickName.charAt(0).toUpperCase()
                                            : user?.email?.charAt(0)?.toUpperCase() || "U"}
                                    </span>
                                )}
                            </div>

                            {/* Placeholder for future Cloudinary Upload */}
                            <button className="absolute bottom-0 right-0 w-10 h-10 bg-white text-indigo-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-center sm:text-left mb-2">
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                {userProfile?.fullName || user?.displayName || "My Profile"}
                            </h1>
                            <p className="text-indigo-100 font-medium mt-1">Manage your public persona</p>
                        </div>
                    </div>
                </div>

                {/* Profile Form */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 transition-colors duration-300">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
                        <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Personal Information
                    </h2>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nick Name</label>
                                <input
                                    type="text"
                                    value={nickName}
                                    onChange={(e) => setNickName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
                                    required
                                />
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Used on leaderboards and recent activity.</p>
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                <Save className="w-5 h-5" />
                                {loading ? "Saving..." : "Save Profile"}
                            </button>
                            {successMsg && <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm animate-fadeIn bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-lg">{successMsg}</span>}
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}

export default MyProfile;
