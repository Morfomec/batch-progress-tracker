import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useOutletContext } from "react-router-dom";
import { ArrowLeft, User as UserIcon, MapPin, Linkedin, Calendar, Target, Award, Activity } from "lucide-react";

function PeerProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { group } = useOutletContext();

    const [peerProfile, setPeerProfile] = useState(null);
    const [peerProgress, setPeerProgress] = useState([]);
    const [totalScore, setTotalScore] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPeerData = async () => {
            if (!userId || !group) return;

            try {
                // 1. Fetch User Profile
                const userDocRef = doc(db, "users", userId);
                const userSnap = await getDoc(userDocRef);

                if (userSnap.exists()) {
                    setPeerProfile(userSnap.data());
                } else {
                    console.warn("Peer profile not found.");
                }

                // 2. Fetch User Progress in THIS group
                const q = query(
                    collection(db, "groups", group.id, "progress"),
                    where("userId", "==", userId),
                    orderBy("createdAt", "desc")
                );

                const progressSnap = await getDocs(q);
                const progressData = progressSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setPeerProgress(progressData);

                // 3. Calculate Total Score
                const score = progressData.reduce((acc, curr) => acc + (curr.score || 0), 0);
                setTotalScore(score);

            } catch (error) {
                console.error("Error fetching peer data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPeerData();
    }, [userId, group]);

    if (loading) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!peerProfile) {
        return (
            <div className="p-8 text-center text-slate-500">
                User profile not found or does not exist.
            </div>
        );
    }

    const displayName = peerProfile.nickName || peerProfile.fullName || peerProfile.displayName || "Unknown Student";

    return (
        <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {/* Profile Header Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative transition-colors duration-300">
                    {/* Header Background */}
                    <div className="h-32 sm:h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-950 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>

                    <div className="px-6 sm:px-10 pb-8 relative">
                        {/* Avatar */}
                        <div className="flex justify-between items-end -mt-16 sm:-mt-20 mb-6">
                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-lg relative z-10 overflow-hidden">
                                {peerProfile.photoURL ? (
                                    <img src={peerProfile.photoURL} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-600 dark:to-purple-700 flex items-center justify-center text-white text-5xl font-bold">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
                                    {displayName}
                                    {peerProfile.nickName && peerProfile.fullName && (
                                        <span className="text-lg font-medium text-slate-400 dark:text-slate-500 font-normal">
                                            ({peerProfile.fullName})
                                        </span>
                                    )}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
                                    {peerProfile.location && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4" />
                                            {peerProfile.location}
                                        </div>
                                    )}
                                    {peerProfile.linkedinUrl && (
                                        <a
                                            href={peerProfile.linkedinUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            <Linkedin className="w-4 h-4" />
                                            LinkedIn Profile
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Points Badge */}
                            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/30 px-5 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                <Award className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                <div>
                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Total Score</p>
                                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{totalScore}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        {peerProfile.bio && (
                            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <p className="text-slate-700 dark:text-slate-300 italic">"{peerProfile.bio}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress History */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                    <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-3">
                        <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            Activity in {group.groupName}
                        </h2>
                    </div>

                    <div className="p-0 sm:p-4">
                        {peerProgress.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 mb-4">
                                    <Target className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">No activity logged yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 p-4">
                                {peerProgress.map((item) => (
                                    <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">

                                        <div className="flex items-start sm:items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Module</span>
                                                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{item.moduleNo}</span>
                                            </div>

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${item.examStatus === 'Passed' ? 'bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400' :
                                                        item.examStatus === 'Repeat' ? 'bg-amber-100/80 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400' :
                                                            'bg-sky-100/80 dark:bg-sky-500/20 text-sky-800 dark:text-sky-400'
                                                        }`}>
                                                        {item.examStatus}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                                                    <Linkedin className="w-4 h-4 text-slate-400" />
                                                    LinkedIn: {item.linkedinActivity}
                                                    {item.postLink && (
                                                        <a href={item.postLink} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline ml-1">
                                                            (View Post)
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 border-t sm:border-t-0 border-slate-200 dark:border-slate-700 pt-3 sm:pt-0">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">+{item.score || 0}</span>
                                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase">Pts</span>
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PeerProfile;
