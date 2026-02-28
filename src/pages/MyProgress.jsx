import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useOutletContext, Link } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, doc, getDocs, orderBy, updateDoc, serverTimestamp } from "firebase/firestore";
import { calculateScore } from "../utils/calculateScore";
import { History, Edit3, X, Save, ArrowLeft } from "lucide-react";

function MyProgress() {
    const { user } = useAuth();
    const { group } = useOutletContext();
    const [progressList, setProgressList] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(true);

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

            // Sort by moduleNo descending
            data.sort((a, b) => b.moduleNo - a.moduleNo);

            setProgressList(data);
        } catch (error) {
            console.error("Error fetching progress:", error);
        } finally {
            setLoading(false);
        }
    }, [group, user]);

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
        try {
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
            await fetchProgress();

        } catch (error) {
            console.error(error);
            alert("Update failed");
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">

                {/* Header Action */}
                <div className="mb-6">
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                {/* Glassmorphic Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-200/50 dark:border-white/5 transition-colors duration-300 relative overflow-hidden sm:h-36">
                    {/* Background glows */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

                    <div className="flex items-center gap-6 relative z-10 w-full">
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
                </div>

                <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl rounded-[2rem] shadow-xl dark:shadow-2xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden transition-colors duration-300 p-8">
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
                                                <td className="py-4 px-4 text-slate-600 dark:text-slate-400 text-sm">{item.linkedinActivity}</td>
                                                <td className="py-4 px-4 text-slate-600 dark:text-slate-400 text-sm">{item.linkedinCount}</td>
                                                <td className="py-4 px-4">
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{item.score ?? 0}</span>
                                                </td>
                                                <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-sm">
                                                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : "—"}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <button
                                                        onClick={() => handleEditClick(item)}
                                                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    >
                                                        <Edit3 className="w-5 h-5" />
                                                    </button>
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
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Post Link</label>
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
        </div>
    );
}

export default MyProgress;