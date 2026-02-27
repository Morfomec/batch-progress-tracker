import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { User, Save, Camera, Loader2, Trash2, Smile, X } from "lucide-react";
import Cropper from "react-easy-crop";
import EmojiPicker from "emoji-picker-react";
import getCroppedImg from "../utils/cropImage";

function MyProfile() {
    const { user, userProfile } = useAuth();
    const fileInputRef = useRef(null);

    const [fullName, setFullName] = useState("");
    const [nickName, setNickName] = useState("");
    const [emoji, setEmoji] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // Cropper State
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    // Emoji Picker State
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

    const handleImageChange = (e) => {
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

        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setImageSrc(reader.result?.toString() || "");
            setIsCropping(true);
        });
        reader.readAsDataURL(file);
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropUpload = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setUploadingImage(true);
        setSuccessMsg("");

        try {
            const croppedImageBlobUrl = await getCroppedImg(imageSrc, croppedAreaPixels);

            // Convert Blob URL back to Blob text for upload
            const response = await fetch(croppedImageBlobUrl);
            const blob = await response.blob();
            // Create a File from Blob
            const file = new File([blob], "profile_photo.jpg", { type: "image/jpeg" });

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
            setIsCropping(false); // Close cropper
            setImageSrc(null);

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

    const handleCancelCrop = () => {
        setIsCropping(false);
        setImageSrc(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
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
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-300 relative">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">

                {/* Glassmorphic Banner Header */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-200/50 dark:border-white/5 relative overflow-hidden transition-all duration-300">
                    {/* Background glows matching dashboard style */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 justify-between">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                            {/* Avatar / Photo Area */}
                            <div className="relative group flex-shrink-0">
                                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-slate-100 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-5xl font-bold shadow-2xl overflow-hidden backdrop-blur-md relative z-10">
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

                                {/* Emoji Overlay Button */}
                                <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="absolute top-1 right-1 z-20 w-10 h-10 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer"
                                    title="Choose your emoji"
                                >
                                    {emoji || <Smile className="w-5 h-5 text-slate-400" />}
                                </button>

                                {/* Emoji Picker Popover */}
                                {showEmojiPicker && (
                                    <div className="absolute top-12 left-full ml-4 z-[100] animate-fadeIn">
                                        <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)}></div>
                                        <div className="relative shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                            <EmojiPicker
                                                onEmojiClick={(emojiData) => {
                                                    setEmoji(emojiData.emoji);
                                                    setShowEmojiPicker(false);
                                                }}
                                                theme="auto"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Photo Upload Area */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                />
                                <div className="absolute bottom-1 right-1 z-20 flex flex-col gap-2">
                                    <button
                                        onClick={() => !uploadingImage && fileInputRef.current?.click()}
                                        disabled={uploadingImage}
                                        className={`w-12 h-12 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center transition-transform ${uploadingImage ? 'opacity-75 cursor-not-allowed' : 'hover:scale-110 hover:-translate-y-1 hover:shadow-indigo-500/50'}`}
                                        aria-label="Upload profile picture"
                                    >
                                        {uploadingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                                    </button>
                                </div>
                            </div>

                            <div className="text-center sm:text-left mb-2">
                                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                                    {userProfile?.fullName || user?.displayName || "My Profile"}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Manage your public persona</p>
                            </div>
                        </div>

                        {/* Redesigned Delete Photo Button */}
                        {userProfile?.photoURL && (
                            <div className="mb-2 sm:self-center">
                                <button
                                    onClick={handleRemoveImage}
                                    disabled={uploadingImage}
                                    className="group flex flex-row items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20 transition-all duration-300"
                                >
                                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold tracking-wide">Remove Photo</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>{/* Profile Form */}
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
                </div >

        {/* Cropper Modal */ }
    {
        isCropping && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg flex flex-col overflow-hidden animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Crop Profile Photo</h3>
                        <button onClick={handleCancelCrop} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1} // Square avatar
                            cropShape="round" // Show circular crop guide
                            showGrid={false}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>

                    {/* Zoom Slider */}
                    <div className="mt-6 flex items-center gap-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-12">Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-label="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={handleCancelCrop}
                            className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCropUpload}
                            disabled={uploadingImage}
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

            {/* Cropper Modal */ }
        {
            isCropping && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg flex flex-col overflow-hidden animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Crop Profile Photo</h3>
                            <button onClick={handleCancelCrop} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} // Square avatar
                                cropShape="round" // Show circular crop guide
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        {/* Zoom Slider */}
                        <div className="mt-6 flex items-center gap-4">
                            <span className="text-sm text-slate-500 dark:text-slate-400 min-w-12">Zoom</span>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-label="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={handleCancelCrop}
                                className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCropUpload}
                                disabled={uploadingImage}
                                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center justify-center min-w-[120px]"
                            >
                                {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Photo"}
                            </button>
                        </div>
                    </div>
                </div>
                        </div >
                    </div >
                </div >
            )
        }
        </div >
    );
    }

    export default MyProfile;
