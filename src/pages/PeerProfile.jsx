import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { ArrowLeft, User as UserIcon, MapPin, Linkedin, Calendar, Target, Award, Activity, MessageCircle, Hand, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getPokeStatus, sendPoke, acceptPoke } from "../firebase/pokeService";
import toast from "react-hot-toast";

function PeerProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { group } = useOutletContext();
    const { user, userProfile } = useAuth();

    const [peerProfile, setPeerProfile] = useState(null);
    const [peerProgress, setPeerProgress] = useState([]);
    const [totalScore, setTotalScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [pokeData, setPokeData] = useState({ status: 'loading' });
    const [cooldownRemaining, setCooldownRemaining] = useState(0);

    const COOLDOWN_HOURS = 2;
    const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

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

                // 2. Fetch User Progress
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
                const score = progressData.reduce((acc, curr) => acc + (curr.score || 0), 0);
                setTotalScore(score);

                // 3. Fetch Poke Status
                if (user.uid !== userId) {
                   const pStatus = await getPokeStatus(user.uid, userId);
                   setPokeData(pStatus);
                } else {
                   setPokeData({ status: 'self' });
                }

            } catch (error) {
                console.error("Error fetching peer data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPeerData();
    }, [userId, group, user.uid]);

    // Cooldown Timer Effect
    useEffect(() => {
        if (pokeData.status === 'sent' && pokeData.createdAt) {
            const calculateCooldown = () => {
                const now = Date.now();
                const created = pokeData.createdAt.toMillis ? pokeData.createdAt.toMillis() : Date.now();
                const elapsed = now - created;
                const remaining = Math.max(0, COOLDOWN_MS - elapsed);
                setCooldownRemaining(remaining);
            };

            calculateCooldown();
            const interval = setInterval(calculateCooldown, 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [pokeData, COOLDOWN_MS]);

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

    const displayName = peerProfile.nickName || peerProfile.fullName || peerProfile.displayName || "Unknown";

    const handlePokeAction = async () => {
        const canPoke = pokeData.status === 'none' || (pokeData.status === 'sent' && cooldownRemaining === 0);
        
        if (canPoke) {
            const isRePoke = pokeData.status === 'sent';
            await sendPoke(user.uid, userId, userProfile?.nickName || userProfile?.fullName || user?.displayName);
            
            // Refresh poke data
            const pStatus = await getPokeStatus(user.uid, userId);
            setPokeData(pStatus);
            
            toast.success(isRePoke ? `You poked ${displayName} again!` : `You poked ${displayName}!`);
        } else if (pokeData.status === 'received') {
            const chatId = await acceptPoke(pokeData.pokeId, user.uid, userId, userProfile?.fullName || "User", displayName);
            setPokeData({ status: 'accepted', chatId });
            toast.success("Poke accepted! Private chat created.");
            navigate("/dashboard/chat");
        } else if (pokeData.status === 'accepted') {
            navigate("/dashboard/chat");
        }
    };

    const formatRemainingTime = (ms) => {
        const mins = Math.ceil(ms / 60000);
        if (mins >= 60) {
            const hours = Math.floor(mins / 60);
            const remainingMins = mins % 60;
            return `${hours}h ${remainingMins}m`;
        }
        return `${mins}m`;
    };

    const isPokeInCooldown = pokeData.status === 'sent' && cooldownRemaining > 0;

    return (
        <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {/* Profile Header Card */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-white/5 overflow-hidden relative transition-colors duration-300">
                    <div className="h-32 sm:h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-950 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    </div>

                    <div className="px-6 sm:px-10 pb-8 relative">
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

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
                                    {displayName}
                                    {peerProfile.fullName && (
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
                                        <a href={peerProfile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline">
                                            <Linkedin className="w-4 h-4" />
                                            LinkedIn
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                {pokeData.status !== 'self' && pokeData.status !== 'loading' && (
                                    <button
                                        onClick={handlePokeAction}
                                        disabled={isPokeInCooldown}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl border font-bold shadow-sm transition-all ${
                                            pokeData.status === 'none' 
                                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent'
                                                : isPokeInCooldown
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                                                : pokeData.status === 'sent' // Sent but cooldown finished
                                                ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                                                : pokeData.status === 'received'
                                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent animate-pulse'
                                                : 'bg-white hover:bg-slate-50 dark:bg-transparent dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80'
                                        }`}
                                    >
                                        {pokeData.status === 'none' ? <><Hand className="w-5 h-5" /> Poke {displayName}</> :
                                         isPokeInCooldown ? <><Clock className="w-5 h-5" /> Cooldown: {formatRemainingTime(cooldownRemaining)}</> :
                                         pokeData.status === 'sent' ? <><Hand className="w-5 h-5" /> Poke Again</> :
                                         pokeData.status === 'received' ? <><Hand className="w-5 h-5" /> Poke Back (Chat)</> :
                                         <><MessageCircle className="w-5 h-5" /> Open Chat</>}
                                    </button>
                                )}

                                <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/30 px-5 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                                    <Award className="w-8 h-8" />
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider">Total Score</p>
                                        <p className="text-2xl font-black leading-none">{totalScore}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {peerProfile.bio && (
                            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <p className="text-slate-700 dark:text-slate-300 italic">"{peerProfile.bio}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress History - Only visible to self */}
                {user.uid === userId && (
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-white/5 overflow-hidden transition-colors duration-300">
                        <div className="px-8 py-6 border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
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
                                                <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Module</span>
                                                    <span className="text-xl font-black text-indigo-600 leading-none">{item.moduleNo}</span>
                                                </div>
                                                <div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.examStatus === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {item.examStatus}
                                                    </span>
                                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">{item.linkedinActivity}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-1 text-indigo-600">
                                                <span className="text-2xl font-black">{item.score || 0}</span>
                                                <span className="text-xs font-bold uppercase mb-1">pts</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PeerProfile;
