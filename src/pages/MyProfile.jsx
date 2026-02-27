import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { User, Save, Camera, Loader2, Trash2, Smile } from "lucide-react";

function MyProfile() {
    const { user, userProfile } = useAuth();
    const fileInputRef = useRef(null);

    const [fullName, setFullName] = useState("");
    const [nickName, setNickName] = useState("");
    const [emoji, setEmoji] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const EMOJI_OPTIONS = ["🚀", "🔥", "✨", "🌟", "💡", "🎯", "🏆", "🎮", "💻", "🧠", "⚡", "🔮", "👑", "😎", "👾", "🦊", "🐯", "💎", "🐉", "🍔"];

    useEffect(() => {
        if (userProfile) {
            setFullName(userProfile.fullName || "");
            setNickName(userProfile.nickName || "");
            setEmoji(userProfile.emoji || "");
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
                emoji,
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

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large. Maximum size is 5MB.");
            return;
        }

        setUploadingImage(true);
        setSuccessMsg("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "react_firebase_project_upload");

            // Cloudinary upload URL requires the cloud name (defrohr5n)
            const uploadUrl = "https://api.cloudinary.com/v1_1/defrohr5n/image/upload";

            const res = await fetch(uploadUrl, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error?.message || "Cloudinary upload failed");
            }

            const newPhotoURL = data.secure_url;

            // Update user document in Firestore
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                photoURL: newPhotoURL
            });

            // Local userProfile context will auto-update via onSnapshot in AuthContext
            setSuccessMsg("Profile photo updated successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);

        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image. " + error.message);
        } finally {
            setUploadingImage(false);
            // Reset input so the same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveImage = async () => {
        if (!userProfile?.photoURL) return;

        setUploadingImage(true);
        setSuccessMsg("");

        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                photoURL: ""
            });
            setSuccessMsg("Profile photo removed.");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (error) {
            console.error("Error removing image:", error);
            alert("Failed to remove image.");
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">

                        {/* Avatar / Photo Upload Area */}
                        <div className="relative group flex-shrink-0">
                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white/20 bg-indigo-900/50 flex items-center justify-center text-5xl font-bold shadow-2xl overflow-hidden backdrop-blur-md ring-4 ring-white/10">
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

                            {/* Photo Upload Area */}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                            />
                            <div className="absolute bottom-1 right-1 flex flex-col gap-2">
                                {userProfile?.photoURL && (
                                    <button
                                        onClick={handleRemoveImage}
                                        disabled={uploadingImage}
                                        className="w-10 h-10 bg-white/10 backdrop-blur-md text-red-400 hover:bg-red-500 hover:text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300"
                                        aria-label="Remove profile picture"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => !uploadingImage && fileInputRef.current?.click()}
                                    disabled={uploadingImage}
                                    className={`w-12 h-12 bg-white text-indigo-600 rounded-full shadow-xl flex items-center justify-center transition-transform ${uploadingImage ? 'opacity-75 cursor-not-allowed' : 'hover:scale-110 hover:-translate-y-1 hover:shadow-indigo-500/50'}`}
                                    aria-label="Upload profile picture"
                                >
                                    {uploadingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                                </button>
                            </div>
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
                <div className="bg-slate-900/50 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl p-6 sm:p-8 transition-colors duration-300">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <User className="w-5 h-5 text-indigo-400" />
                        Personal Information
                    </h2>

                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/50 text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder-slate-500/80"
                                    required
                                    placeholder="Jane Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Nick Name</label>
                                <input
                                    type="text"
                                    value={nickName}
                                    onChange={(e) => setNickName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/50 text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder-slate-500/80"
                                    required
                                    placeholder="Jane"
                                />
                                <p className="mt-2 text-xs text-slate-400">Used on leaderboards and recent activity.</p>
                            </div>
                        </div>

                        {/* Emoji Selection */}
                        <div className="pt-2">
                            <h3 className="block text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                                <Smile className="w-4 h-4 text-purple-400" />
                                Choose Your Emoji Sign
                            </h3>
                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                                {EMOJI_OPTIONS.map((emj) => (
                                    <button
                                        key={emj}
                                        type="button"
                                        onClick={() => setEmoji(emj)}
                                        className={`w-12 h-12 flex items-center justify-center text-2xl rounded-2xl transition-all duration-300 ${emoji === emj
                                                ? 'bg-indigo-500 border border-indigo-400 shadow-lg shadow-indigo-500/40 scale-110'
                                                : 'bg-slate-800 border border-transparent hover:bg-slate-700 hover:scale-105 opacity-80 hover:opacity-100'
                                            }`}
                                    >
                                        {emj}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-slate-400">This will be displayed next to your name globally.</p>
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
