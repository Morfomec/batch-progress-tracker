import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useOutletContext, Link } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, doc, getDocs, orderBy, updateDoc, serverTimestamp, addDoc, deleteDoc } from "firebase/firestore";
import { calculateScore } from "../utils/calculateScore";
import { History, Edit3, X, Save, ArrowLeft, PlusCircle, Target, Activity, Trash2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

function MyProgress() {
    const { user, userProfile } = useAuth();
    const { group } = useOutletContext();
    const [progressList, setProgressList] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(true);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        moduleNo: "",
        examStatus: "",
        linkedinActivity: "",
        linkedinCount: "",
        postLink: "",
    });

    const fetchProgress = useCallback(async () => {
        if (!group) {
            setLoading(false);
            return;
        }
        if (!user) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, "groups", group.id, "progress"),
                where("userId", "==", user.uid)
                // We'll sort it client-side to ensure moduleNo acts numerically
            );

            const snapshot = await getDocs(q);

            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by moduleNo descending, then by date descending
            data.sort((a, b) => {
                if (b.moduleNo !== a.moduleNo) {
                    return b.moduleNo - a.moduleNo;
                }
                const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return dateB - dateA;
            });

            setProgressList(data);
        } catch (error) {
            console.error("Error fetching progress:", error);
        } finally {
            setLoading(false);
        }
    }, [group, user]);

    const handleFormChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!group) {
            toast.error("No group found");
            return;
        }

        if (formData.linkedinActivity === "Posted" && !formData.postLink.trim()) {
            toast.error("Please provide the LinkedIn Post Link.");
            return;
        }

        try {
            // Check connection count and module rules
            const currentLinkedinCount = Number(formData.linkedinCount || 0);
            if (currentLinkedinCount < 0) {
                toast.error("Connection count cannot be negative.");
                return;
            }

            const allUserProgressQuery = query(
                collection(db, "groups", group.id, "progress"),
                where("userId", "==", user.uid)
            );
            const allUserProgressDocs = await getDocs(allUserProgressQuery);

            let maxConnectionCount = 0;
            let hasPassedThisModule = false;

            allUserProgressDocs.forEach(doc => {
                const data = doc.data();
                if (data.linkedinCount > maxConnectionCount) {
                    maxConnectionCount = data.linkedinCount;
                }
                if (data.moduleNo === Number(formData.moduleNo)) {
                    if (data.examStatus === "Passed") hasPassedThisModule = true;
                }
            });

            if (formData.linkedinCount !== "" && currentLinkedinCount < maxConnectionCount) {
                toast.error(`Connection count cannot be less than your previous count (${maxConnectionCount}).`);
                return;
            }

            if (hasPassedThisModule && formData.examStatus === "Passed") {
                toast.error(`You have already passed Module ${formData.moduleNo}.`);
                return;
            }

            const score = calculateScore(
                formData.examStatus,
                formData.linkedinActivity,
            );

            await addDoc(collection(db, "groups", group.id, "progress"), {
                userId: user.uid,
                userName: userProfile?.nickName || userProfile?.fullName || user.displayName || user.email,
                moduleNo: Number(formData.moduleNo),
                examStatus: formData.examStatus,
                linkedinActivity: formData.linkedinActivity,
                linkedinCount: formData.linkedinCount || 0,
                postLink: formData.postLink,
                score: score,
                createdAt: serverTimestamp(),
            });

            setFormData({
                moduleNo: "",
                examStatus: "",
                linkedinActivity: "",
                linkedinCount: "",
                postLink: "",
            });

            setShowForm(false);
            toast.success("Progress saved successfully!");
            await fetchProgress();

        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save progress");
        }
    };

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    const handleEditClick = (item) => {
        setEditingItem(item.id);
        setEditData({
            moduleNo: item.moduleNo,
            examStatus: item.examStatus,
            linkedinActivity: item.linkedinActivity,
            linkedinCount: item.linkedinCount,
            postLink: item.postLink || ""
        });
    };

    const handleEditChange = (e) => {
        setEditData({
            ...editData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = async () => {
        if (editData.linkedinActivity === "Posted" && (!editData.postLink || !editData.postLink.trim())) {
            toast.error("Please provide the LinkedIn Post Link.");
            return;
        }

        try {
            // Check connection count and module rules
            const currentLinkedinCount = Number(editData.linkedinCount || 0);
            if (currentLinkedinCount < 0) {
                toast.error("Connection count cannot be negative.");
                return;
            }

            const allUserProgressQuery = query(
                collection(db, "groups", group.id, "progress"),
                where("userId", "==", user.uid)
            );
            const existingDocs = await getDocs(allUserProgressQuery);

            let maxConnectionCountOther = 0;
            let hasPassedThisModuleOther = false;

            existingDocs.docs.forEach(doc => {
                if (doc.id === editingItem) return;

                const data = doc.data();
                if (data.linkedinCount > maxConnectionCountOther) {
                    maxConnectionCountOther = data.linkedinCount;
                }
                if (data.moduleNo === Number(editData.moduleNo)) {
                    if (data.examStatus === "Passed") hasPassedThisModuleOther = true;
                }
            });

            if (editData.linkedinCount !== "" && currentLinkedinCount < maxConnectionCountOther) {
                toast.error(`Connection count cannot be less than your previous count (${maxConnectionCountOther}).`);
                return;
            }

            if (hasPassedThisModuleOther && editData.examStatus === "Passed") {
                toast.error(`You have already submitted a Passed status for Module ${editData.moduleNo}.`);
                return;
            }

            const docRef = doc(db, "groups", group.id, "progress", editingItem);

            const newScore = calculateScore(
                editData.examStatus,
                editData.linkedinActivity
            );

            await updateDoc(docRef, {
                moduleNo: Number(editData.moduleNo),
                examStatus: editData.examStatus,
                linkedinActivity: editData.linkedinActivity,
                linkedinCount: Number(editData.linkedinCount),
                postLink: editData.postLink,
                score: newScore,
                updatedAt: serverTimestamp()
            });

            setEditingItem(null);
            toast.success("Progress updated successfully!");
            await fetchProgress();

        } catch (error) {
            console.error(error);
            toast.error("Update failed");
        }
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete || !group) return;

        try {
            const docRef = doc(db, "groups", group.id, "progress", itemToDelete.id);
            await deleteDoc(docRef);

            toast.success("Progress entry deleted successfully");
            setIsDeleteModalOpen(false);
            setItemToDelete(null);

            await fetchProgress();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete progress");
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-3 sm:p-4 lg:p-6 transition-colors duration-300">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">

                {/* Header Action */}
                <div className="mb-6">
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                {/* Glassmorphic Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-200/50 dark:border-white/5 transition-colors duration-300 relative overflow-hidden">
                    {/* Background glows */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full relative z-10 gap-4">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/50 dark:border-slate-700/50 shrink-0">
                                <History className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">My Progress History</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
                                    Review and edit your past weekly submissions.
                                </p>
                            </div>
                        </div>
                        {group && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 border border-indigo-500 w-full sm:w-auto mt-4 sm:mt-0"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Log Weekly Progress
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl rounded-[2rem] shadow-xl dark:shadow-2xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden transition-colors duration-300 p-5 sm:p-6">
                    <div className="">
                        {!group ? (
                            <div className="text-center py-16 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <History className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No Group Assigned</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                    You are not part of any group yet. Join a group to start tracking your progress!
                                </p>
                            </div>
                        ) : loading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400 rounded-full animate-spin"></div>
                            </div>
                        ) : progressList.length === 0 ? (
                            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <History className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No History Yet</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                    You haven't submitted any progress. Complete your weekly update from the Dashboard!
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                                            <th className="pb-4 px-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Module</th>
                                            <th className="pb-4 px-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Status</th>
                                            <th className="pb-4 px-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">LinkedIn</th>
                                            <th className="pb-4 px-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Connections</th>
                                            <th className="pb-4 px-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Score</th>
                                            <th className="pb-4 px-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Date</th>
                                            <th className="pb-4 px-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {progressList.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <td className="py-4 px-4">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">Module {item.moduleNo}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${item.examStatus === 'Passed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                        item.examStatus === 'Repeat' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                                            'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400'
                                                        }`}>
                                                        {item.examStatus}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-slate-600 dark:text-slate-400 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span>{item.linkedinActivity}</span>
                                                        {item.postLink && (
                                                            <a
                                                                href={item.postLink.startsWith('http') ? item.postLink : `https://${item.postLink}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                                                title="View Post"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-slate-600 dark:text-slate-400 text-sm">{item.linkedinCount}</td>
                                                <td className="py-4 px-4">
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{item.score ?? 0}</span>
                                                </td>
                                                <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-sm">
                                                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : "—"}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEditClick(item)}
                                                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                                            title="Edit Entry"
                                                        >
                                                            <Edit3 className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(item)}
                                                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                                            title="Delete Entry"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for Logging Progress */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowForm(false)}></div>

                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 animate-fadeIn transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                                    <Activity className="w-6 h-6" />
                                </div>
                                Log Progress
                            </h3>
                            <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-5 relative">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Module Number</label>
                                <input
                                    type="number"
                                    name="moduleNo"
                                    placeholder="e.g. 25"
                                    value={formData.moduleNo}
                                    onChange={handleFormChange}
                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition font-medium"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Exam Status</label>
                                    <select
                                        name="examStatus"
                                        value={formData.examStatus}
                                        onChange={handleFormChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition appearance-none font-medium"
                                        required
                                    >
                                        <option value="">Select status</option>
                                        <option value="Passed">Passed</option>
                                        <option value="Repeat">Repeat</option>
                                        <option value="Reschedule">Rescheduled</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">LinkedIn Activity</label>
                                    <select
                                        name="linkedinActivity"
                                        value={formData.linkedinActivity}
                                        onChange={handleFormChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition appearance-none font-medium"
                                        required
                                    >
                                        <option value="">Select activity</option>
                                        <option value="Posted">Posted</option>
                                        <option value="Commented">Commented</option>
                                        <option value="Shared">Shared</option>
                                        <option value="None">None</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Connection Count</label>
                                    <input
                                        type="number"
                                        name="linkedinCount"
                                        placeholder="Total connections"
                                        value={formData.linkedinCount}
                                        onChange={handleFormChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                        Post Link {formData.linkedinActivity === "Posted" ? <span className="text-red-500">*</span> : "(Optional)"}
                                    </label>
                                    <input
                                        type="text"
                                        name="postLink"
                                        placeholder="URL"
                                        value={formData.postLink}
                                        onChange={handleFormChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition font-medium"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 mt-4 rounded-xl font-bold transition-all hover:scale-[1.01] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                            >
                                <Target className="w-5 h-5" />
                                Submit Progress
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal for Editing */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-transparent dark:border-slate-700">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                Edit Progress Info
                            </h3>
                            <button
                                onClick={() => setEditingItem(null)}
                                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Module Number</label>
                                <input
                                    type="number"
                                    name="moduleNo"
                                    value={editData.moduleNo}
                                    onChange={handleEditChange}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Exam Status</label>
                                <select
                                    name="examStatus"
                                    value={editData.examStatus}
                                    onChange={handleEditChange}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition appearance-none"
                                >
                                    <option value="Passed">Passed</option>
                                    <option value="Repeat">Repeat</option>
                                    <option value="Reschedule">Rescheduled</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">LinkedIn Activity</label>
                                <select
                                    name="linkedinActivity"
                                    value={editData.linkedinActivity}
                                    onChange={handleEditChange}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition appearance-none"
                                >
                                    <option value="Posted">Posted</option>
                                    <option value="Commented">Commented</option>
                                    <option value="Shared">Shared</option>
                                    <option value="None">None</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Connection Count</label>
                                <input
                                    type="number"
                                    name="linkedinCount"
                                    value={editData.linkedinCount}
                                    onChange={handleEditChange}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Post Link {editData.linkedinActivity === "Posted" && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="text"
                                    name="postLink"
                                    value={editData.postLink}
                                    onChange={handleEditChange}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingItem(null)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none"
                            >
                                <Save className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Progress Log"
                description={`Are you sure you want to delete your progress log for Module ${itemToDelete?.moduleNo}? This action permanently removes this entry and updates your batch timeline.`}
                confirmText="delete"
                actionButtonText="Delete Log"
            />
        </div>
    );
}

export default MyProgress;