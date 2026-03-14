import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useOutletContext } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, updateDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { Zap, Shield, Trophy, RefreshCcw, Info, Edit3, Plus, Search, CheckCircle2, X, Flame } from "lucide-react";
import toast from "react-hot-toast";
import WordOfTheDay from "../components/WordOfTheDay";

function EnglishKick() {
    const { user, isAdmin } = useAuth();
    const { group } = useOutletContext();

    const [coordinator, setCoordinator] = useState(null);
    const [rules, setRules] = useState("");
    const [membersData, setMembersData] = useState([]);
    const [allUsers, setAllUsers] = useState({});

    const [isEditingRules, setIsEditingRules] = useState(false);
    const [tempRules, setTempRules] = useState("");
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [showCoordinatorModal, setShowCoordinatorModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    // Fetch initial data
    useEffect(() => {
        if (!group?.id) return;
        fetchData();
    }, [group?.id]);

    const fetchData = async () => {
        try {
            // 1. Fetch group document for coordinator, rules, description
            const groupRef = doc(db, "groups", group.id);
            const groupSnap = await getDoc(groupRef);

            if (groupSnap.exists()) {
                const data = groupSnap.data();
                setCoordinator(data.englishKickCoordinator || null);
                setRules(data.englishKickRules || "No rules defined yet.");
                setTempRules(data.englishKickRules || "No rules defined yet.");
            }

            // 2. Fetch all users to map IDs to names/emojis
            const usersSnap = await getDocs(collection(db, "users"));
            const usersMap = {};
            usersSnap.docs.forEach(d => {
                const uData = d.data();
                usersMap[d.id] = {
                    name: uData.nickName || uData.fullName || uData.displayName || uData.email || "Unknown",
                    emoji: uData.emoji || "",
                    email: uData.email
                };
            });
            setAllUsers(usersMap);

            // 3. Fetch English Kick points from subcollection
            const pointsRef = collection(db, "groups", group.id, "englishKick");
            const pointsSnap = await getDocs(pointsRef);
            const pointsMap = {};
            pointsSnap.docs.forEach(d => {
                pointsMap[d.id] = d.data().points || 0;
            });

            // 4. Combine members with their points
            const mergedMembers = (groupSnap.data()?.members || []).map(memberId => {
                return {
                    id: memberId,
                    ...usersMap[memberId],
                    points: pointsMap[memberId] || 0
                };
            });

            // Sort alphabetically instead of by points
            mergedMembers.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            setMembersData(mergedMembers);

        } catch (error) {
            console.error("Error fetching English Kick data:", error);
            toast.error("Failed to load data.");
        }
    };

    const isAuthorized = isAdmin || (coordinator && user.uid === coordinator);

    const handleAssignCoordinator = async (userId) => {
        try {
            await updateDoc(doc(db, "groups", group.id), {
                englishKickCoordinator: userId
            });
            setCoordinator(userId);
            setShowCoordinatorModal(false);
            toast.success("Coordinator assigned successfully.");
        } catch (error) {
            toast.error("Failed to assign coordinator.");
        }
    };

    const handleSaveRules = async () => {
        try {
            await updateDoc(doc(db, "groups", group.id), {
                englishKickRules: tempRules
            });
            setRules(tempRules);
            setIsEditingRules(false);
            toast.success("Rules updated.");
        } catch (error) {
            toast.error("Failed to update rules.");
        }
    };

    const handleAddPoint = async (userId, currentPoints) => {
        try {
            const newPoints = currentPoints + 1;
            await setDoc(doc(db, "groups", group.id, "englishKick", userId), { points: newPoints }, { merge: true });

            setMembersData(prev => {
                const updated = prev.map(m => m.id === userId ? { ...m, points: newPoints } : m);
                return updated.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            });
            toast.success("+1 Point Added!");
        } catch (error) {
            toast.error("Failed to add point.");
        }
    };

    const handleMinusPoint = async (userId, currentPoints) => {
        try {
            const newPoints = Math.max(0, currentPoints - 1);
            if (currentPoints === 0) return; // Prevent unnecessary DB write
            await setDoc(doc(db, "groups", group.id, "englishKick", userId), { points: newPoints }, { merge: true });

            setMembersData(prev => {
                const updated = prev.map(m => m.id === userId ? { ...m, points: newPoints } : m);
                return updated.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            });
            toast.success("-1 Point Deducted!");
        } catch (error) {
            toast.error("Failed to deduct point.");
        }
    };

    const handleResetAllPoints = async () => {
        try {
            const updates = membersData.map(m =>
                setDoc(doc(db, "groups", group.id, "englishKick", m.id), { points: 0 }, { merge: true })
            );
            await Promise.all(updates);

            setMembersData(prev => prev.map(m => ({ ...m, points: 0 })));
            setShowResetModal(false);
            toast.success("All points have been reset to zero.");
        } catch (error) {
            toast.error("Failed to reset points.");
        }
    };

    // Calculate Most Kicks
    const maxPoints = membersData.length > 0 ? Math.max(...membersData.map(m => m.points)) : 0;
    const topKickers = maxPoints > 0 ? membersData.filter(m => m.points === maxPoints) : [];

    if (!group) {
        return <div className="p-8 text-center text-slate-500">Please select a batch first.</div>;
    }

    return (
        <div className="min-h-screen p-3 sm:p-4 lg:p-6">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header Section */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-4 sm:p-5 shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col gap-4">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex-1 min-w-0">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-widest mb-4">
                                <Zap className="w-4 h-4 fill-current" /> English Kicks
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent mb-3">
                                {group.groupName}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                <Shield className="w-4 h-4" /> Coordinator: <span className="text-slate-700 dark:text-slate-200">{coordinator ? allUsers[coordinator]?.name : "Not Assigned"}</span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 block">
                                <WordOfTheDay />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 lg:gap-3 shrink-0">
                            <button
                                onClick={() => setShowRulesModal(true)}
                                className="px-4 py-2 lg:px-5 lg:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Info className="w-4 h-4 shrink-0" />
                                <span>Rules</span>
                            </button>

                            {isAdmin && (
                                <button
                                    onClick={() => setShowCoordinatorModal(true)}
                                    className="px-4 py-2 lg:px-5 lg:py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap"
                                >
                                    <Shield className="w-4 h-4 shrink-0" />
                                    <span>Assign Coordinator</span>
                                </button>
                            )}

                            {isAuthorized && (
                                <button
                                    onClick={() => setShowResetModal(true)}
                                    className="px-4 py-2 lg:px-5 lg:py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-800 whitespace-nowrap"
                                >
                                    <RefreshCcw className="w-4 h-4 shrink-0" />
                                    <span>Reset Points</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Layout - 50/50 Split Width of Header */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">

                    {/* Points Table (Left Half) */}
                    <div className="w-full h-fit bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">English Kicks</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                        <th className="px-4 py-3 w-16 text-center">Sl No</th>
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3 text-center">Points</th>
                                        {isAuthorized && <th className="px-4 py-3 text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {membersData.map((m, index) => (
                                        <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors">
                                            <td className="px-4 py-2.5 text-center text-sm font-bold text-slate-400">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                                                        {(m.name || "U").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate block">{m.name} {m.emoji && <span className="ml-1 text-base">{m.emoji}</span>}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-md font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 text-sm">
                                                    {m.points}
                                                </span>
                                            </td>
                                            {isAuthorized && (
                                                <td className="px-4 py-2.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleMinusPoint(m.id, m.points)}
                                                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors border ${m.points > 0 ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-pointer' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800/50 cursor-not-allowed'} font-bold`}
                                                            title="Subtract 1 Point"
                                                            disabled={m.points <= 0}
                                                        >
                                                            -
                                                        </button>
                                                        <button
                                                            onClick={() => handleAddPoint(m.id, m.points)}
                                                            className="inline-flex items-center justify-center w-8 h-8 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800/50"
                                                            title="Add 1 Point"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {membersData.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">No members found in this batch.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Most Kicks Sidebar (Right Half) */}
                    <div className="w-full h-fit bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2rem] p-1 shadow-xl shadow-amber-500/20 lg:sticky lg:top-24">
                        <div className="bg-white dark:bg-slate-900 rounded-[calc(2rem-4px)] h-full flex flex-col overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-500">
                                    <Flame className="w-5 h-5 flex-shrink-0" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Most Kicks</h2>
                            </div>

                            <div className="flex-1 px-4 py-3 overflow-y-auto max-h-[600px] custom-scrollbar">
                                <div className="flex flex-col gap-3">
                                    {topKickers.length === 0 ? (
                                        <div className="text-center w-full text-slate-500 dark:text-slate-400 py-8 text-sm font-medium">
                                            No kicks awarded yet.
                                        </div>
                                    ) : (
                                        topKickers.map(t => (
                                            <div key={t.id} className="flex items-center gap-2 bg-amber-50/50 dark:bg-amber-900/10 px-3 py-2.5 rounded-xl border border-amber-100 dark:border-amber-900/20 w-full">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                                                    {(t.name || "U").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1">
                                                        <span className="truncate">{t.name}</span> {t.emoji && <span className="text-base">{t.emoji}</span>}
                                                    </p>
                                                    <p className="text-xs font-black text-amber-600 dark:text-amber-500 mt-0.5">{t.points} Pts</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rules Modal */}
            {showRulesModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRulesModal(false)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
                                <Info className="text-indigo-500" /> Rules & Regulations
                            </h2>
                            <button onClick={() => setShowRulesModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {isEditingRules ? (
                            <div className="space-y-4">
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none h-48 lg:h-64 resize-none"
                                    value={tempRules}
                                    onChange={(e) => setTempRules(e.target.value)}
                                />
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setIsEditingRules(false)} className="px-4 py-2 font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                                    <button onClick={handleSaveRules} className="px-4 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">Save Rules</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 lg:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 max-h-[50vh] overflow-y-auto">
                                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
                                        {rules}
                                    </p>
                                </div>
                                {isAuthorized && (
                                    <div className="flex justify-end">
                                        <button onClick={() => setIsEditingRules(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                                            <Edit3 className="w-4 h-4" /> Edit Rules
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Coordinator Assign Modal */}
            {showCoordinatorModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCoordinatorModal(false)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl p-8 border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                                <Shield className="text-indigo-500" /> Assign Coordinator
                            </h2>
                            <button onClick={() => setShowCoordinatorModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                            {membersData.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => handleAssignCoordinator(m.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors border ${coordinator === m.id ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm">
                                        {(m.name || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-left flex-1">{m.name}</span>
                                    {coordinator === m.id && <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowResetModal(false)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm shadow-2xl p-8 border border-slate-200 dark:border-slate-800 text-center">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-500">
                            <RefreshCcw className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold dark:text-white mb-2">Reset All Points?</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">This will set everyone's English Kick points back to zero. This action cannot be undone.</p>

                        <div className="flex gap-3">
                            <button onClick={() => setShowResetModal(false)} className="flex-1 py-3 font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleResetAllPoints} className="flex-1 py-3 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/20 transition-all hover:scale-[1.02]">Confirm Reset</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EnglishKick;
