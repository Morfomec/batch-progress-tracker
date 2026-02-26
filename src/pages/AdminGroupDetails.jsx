import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { collection, getDoc, getDocs, doc, query, orderBy, deleteDoc, updateDoc, addDoc, Timestamp } from "firebase/firestore";
import { ArrowLeft, Users, Edit3, Trash2, X, Save, PlusCircle, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { calculateScore } from "../utils/calculateScore";

function AdminGroupDetails() {
    const { groupId } = useParams();
    const [groupData, setGroupData] = useState(null);
    const [progressList, setProgressList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingItem, setEditingItem] = useState(null);
    const [editData, setEditData] = useState({});

    // Historical Entry Form State
    const [showHistoricalForm, setShowHistoricalForm] = useState(false);
    const [historicalData, setHistoricalData] = useState({
        userId: "",
        userName: "", // Will be derived from selected userId
        moduleNo: "",
        examStatus: "",
        linkedinActivity: "",
        submissionDate: "", // YYYY-MM-DD format
    });
    const [groupMembersList, setGroupMembersList] = useState([]);

    const fetchGroupData = useCallback(async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            // Fetch group info
            const gDoc = await getDoc(doc(db, "groups", groupId));
            if (gDoc.exists()) {
                const groupInfo = gDoc.data();
                setGroupData(groupInfo);

                // Fetch full User docs for the members to populate dropdown
                if (groupInfo.members && groupInfo.members.length > 0) {
                    const usersSnap = await getDocs(collection(db, "users"));
                    const memberDocs = [];
                    usersSnap.docs.forEach(uDoc => {
                        if (groupInfo.members.includes(uDoc.id)) {
                            const uData = uDoc.data();
                            memberDocs.push({
                                id: uDoc.id,
                                displayName: uData.nickName || uData.fullName || uData.displayName || uData.email || "Unknown"
                            });
                        }
                    });
                    setGroupMembersList(memberDocs);
                }
            }

            // Fetch all progress
            const q = query(
                collection(db, "groups", groupId, "progress"),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            const pData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setProgressList(pData);
        } catch (error) {
            console.error("Error fetching admin group data", error);
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        fetchGroupData();
    }, [fetchGroupData]);

    const handleDeleteProgress = async (progressId) => {
        if (!window.confirm("Are you sure you want to permanently delete this record?")) return;
        try {
            await deleteDoc(doc(db, "groups", groupId, "progress", progressId));
            setProgressList(prev => prev.filter(p => p.id !== progressId));
            toast.success("Progress record deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete progress.");
        }
    };

    const handleEditClick = (item) => {
        setEditingItem(item.id);
        setEditData({
            userName: item.userName,
            moduleNo: item.moduleNo,
            examStatus: item.examStatus,
            linkedinActivity: item.linkedinActivity,
            score: item.score
        });
    };

    const handleEditChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        try {
            const docRef = doc(db, "groups", groupId, "progress", editingItem);
            // In Admin land, we'll let them forcefully override score
            await updateDoc(docRef, {
                userName: editData.userName,
                moduleNo: Number(editData.moduleNo),
                examStatus: editData.examStatus,
                linkedinActivity: editData.linkedinActivity,
                score: Number(editData.score)
            });
            setEditingItem(null);
            fetchGroupData();
            toast.success("Record updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update record.");
        }
    };

    const handleHistoricalChange = (e) => {
        let value = e.target.value;
        if (e.target.name === "userId") {
            const selectedMember = groupMembersList.find(m => m.id === value);
            setHistoricalData({
                ...historicalData,
                userId: value,
                userName: selectedMember ? selectedMember.displayName : ""
            });
        } else {
            setHistoricalData({ ...historicalData, [e.target.name]: value });
        }
    };

    const handleHistoricalSubmit = async (e) => {
        e.preventDefault();
        try {
            // Calculate Score
            const score = calculateScore(historicalData.examStatus, historicalData.linkedinActivity);

            // Create Firebase Timestamp from YYYY-MM-DD
            // By default, assuming noon local time to avoid timezone edge cases shifting to previous day
            const dateObj = new Date(`${historicalData.submissionDate}T12:00:00`);
            const createdAtTimestamp = Timestamp.fromDate(dateObj);

            await addDoc(collection(db, "groups", groupId, "progress"), {
                userId: historicalData.userId,
                userName: historicalData.userName,
                moduleNo: Number(historicalData.moduleNo),
                examStatus: historicalData.examStatus,
                linkedinActivity: historicalData.linkedinActivity,
                linkedinCount: 0,
                postLink: "",
                score: score,
                createdAt: createdAtTimestamp,
                adminAdded: true
            });

            toast.success("Historical data added successfully!");
            setHistoricalData({
                userId: "",
                userName: "",
                moduleNo: "",
                examStatus: "",
                linkedinActivity: "",
                submissionDate: "",
            });
            setShowHistoricalForm(false);
            fetchGroupData(); // Refresh list

        } catch (error) {
            console.error("Historical entry error:", error);
            toast.error("Failed to add historical record");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                <div>
                    <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-rose-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Admin Dashboard
                    </Link>
                </div>

                {/* Header */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{groupData?.groupName || "Unknown Group"}</h1>
                        <p className="text-sm font-medium text-slate-400 mt-1">Group ID: {groupId}</p>
                    </div>
                    <div className="flex bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 items-center gap-4">
                        <Users className="w-8 h-8 text-indigo-500" />
                        <div>
                            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{progressList.length}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Submissions</p>
                        </div>
                    </div>
                </div>

                {/* Optional Historical Form Button */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowHistoricalForm(!showHistoricalForm)}
                        className="px-5 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                        {showHistoricalForm ? <X className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                        {showHistoricalForm ? "Close Form" : "Add Historical Data"}
                    </button>
                </div>

                {/* Historical Form */}
                {showHistoricalForm && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-rose-200 dark:border-rose-900/50 p-8 animate-fadeIn">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <Calendar className="w-5 h-5 text-rose-500" />
                            Admin Backfill
                        </h2>

                        <form onSubmit={handleHistoricalSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Select Student</label>
                                    <select
                                        name="userId"
                                        value={historicalData.userId}
                                        onChange={handleHistoricalChange}
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                                    >
                                        <option value="">-- Choose Member --</option>
                                        {groupMembersList.map(member => (
                                            <option key={member.id} value={member.id}>{member.displayName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Original Submission Date</label>
                                    <input
                                        type="date"
                                        name="submissionDate"
                                        required
                                        value={historicalData.submissionDate}
                                        onChange={handleHistoricalChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Module Number</label>
                                    <input
                                        type="number"
                                        name="moduleNo"
                                        placeholder="e.g. 1"
                                        required
                                        value={historicalData.moduleNo}
                                        onChange={handleHistoricalChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Exam Status</label>
                                    <select
                                        name="examStatus"
                                        required
                                        value={historicalData.examStatus}
                                        onChange={handleHistoricalChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                                    >
                                        <option value="">-- Select Status --</option>
                                        <option value="Passed">Passed</option>
                                        <option value="Repeat">Repeat</option>
                                        <option value="Reschedule">Rescheduled</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">LinkedIn Activity</label>
                                    <select
                                        name="linkedinActivity"
                                        required
                                        value={historicalData.linkedinActivity}
                                        onChange={handleHistoricalChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                                    >
                                        <option value="">-- Select Activity --</option>
                                        <option value="Posted">Posted</option>
                                        <option value="Commented">Commented</option>
                                        <option value="Shared">Shared</option>
                                        <option value="None">None</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button type="submit" className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2">
                                    <Save className="w-5 h-5" /> Save Record
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Records Table */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">All Progress Records</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Module</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">LinkedIn</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Score</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {progressList.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{item.userName}</p>
                                            <p className="text-xs text-slate-400">{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : "-"}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Mod {item.moduleNo}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.examStatus}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.linkedinActivity}</td>
                                        <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{item.score}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEditClick(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteProgress(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {progressList.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">No records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Modal for Editing */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-transparent dark:border-slate-700">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-rose-500" />
                                Admin Override
                            </h3>
                            <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">User Name</label>
                                <input type="text" name="userName" value={editData.userName} onChange={handleEditChange} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Module</label>
                                    <input type="number" name="moduleNo" value={editData.moduleNo} onChange={handleEditChange} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Override Score</label>
                                    <input type="number" name="score" value={editData.score} onChange={handleEditChange} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold text-rose-600" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Exam Status</label>
                                <select name="examStatus" value={editData.examStatus} onChange={handleEditChange} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none">
                                    <option value="Passed">Passed</option>
                                    <option value="Repeat">Repeat</option>
                                    <option value="Reschedule">Rescheduled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">LinkedIn Activity</label>
                                <select name="linkedinActivity" value={editData.linkedinActivity} onChange={handleEditChange} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none">
                                    <option value="Posted">Posted</option>
                                    <option value="Commented">Commented</option>
                                    <option value="Shared">Shared</option>
                                    <option value="None">None</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border hover:bg-slate-50 rounded-lg">Cancel</button>
                            <button onClick={handleUpdate} className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save Override
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default AdminGroupDetails;
