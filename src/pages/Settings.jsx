import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { db, auth } from "../firebase/firebaseConfig";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, Save, Shield, LogOut, Trash2 } from "lucide-react";

function Settings() {
    const { user, userProfile } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [privacyMode, setPrivacyMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (userProfile) {
            setPrivacyMode(userProfile.privacyMode || false);
        }
    }, [userProfile]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg("");

        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                privacyMode,
            });

            setSuccessMsg("Settings updated successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (error) {
            console.error("Error updating settings:", error);
            alert("Failed to update settings.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/");
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            try {
                // First delete from Firestore
                await deleteDoc(doc(db, "users", user.uid));

                // Then delete authentication user
                await deleteUser(user);
                navigate("/");
            } catch (error) {
                console.error("Error deleting account:", error);
                alert("Failed to delete account. You may need to sign in again to perform this action.");
            }
        }
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">

                {/* Header */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-2xl border border-slate-200/50 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-sm border border-indigo-100 dark:border-indigo-800">
                            <SettingsIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Account Settings</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your app preferences and security.</p>
                        </div>
                    </div>
                </div>

                {/* Preferences Settings Form */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-white/5 p-8 transition-colors duration-300">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
                            <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Preferences & Privacy
                        </h2>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">Dark Mode</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Toggle dark mode manually.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">Incognito Mode</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Hide my name on the batch leaderboard.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPrivacyMode(!privacyMode)}
                                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${privacyMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${privacyMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="pt-4 flex items-center gap-4">
                                {successMsg && <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm animate-fadeIn">{successMsg}</span>}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-300 flex items-center gap-2 disabled:opacity-70"
                                >
                                    <Save className="w-5 h-5" />
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-red-200/50 dark:border-red-900/30 p-8 transition-colors duration-300">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-6">
                            <Trash2 className="w-5 h-5" />
                            Danger Zone
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleLogout}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 max-w-[250px]"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out Securely
                            </button>

                            <button
                                onClick={handleDeleteAccount}
                                className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50 font-semibold rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 max-w-[250px]"
                            >
                                <Trash2 className="w-5 h-5" />
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Settings;
