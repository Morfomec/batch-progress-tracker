import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Users as UsersIcon, Search, ChevronRight } from "lucide-react";

function Peers() {
    const { group } = useOutletContext();
    const [peers, setPeers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchPeers = async () => {
            if (!group) {
                setLoading(false);
                return;
            }

            try {
                // Fetch all users to get details
                const usersSnap = await getDocs(collection(db, "users"));
                const usersMap = {};
                usersSnap.docs.forEach(doc => {
                    usersMap[doc.id] = { id: doc.id, ...doc.data() };
                });

                // Fetch progress to get total scores
                const progressQuery = query(collection(db, "groups", group.id, "progress"));
                const progressSnap = await getDocs(progressQuery);
                const scoresMap = {};
                progressSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (!scoresMap[data.userId]) scoresMap[data.userId] = 0;
                    scoresMap[data.userId] += (data.score || 0);
                });

                // Filter members and map their details
                const groupMembers = group.members || [];
                const mappedPeers = groupMembers
                    .filter(memberId => usersMap[memberId] && !usersMap[memberId].isBlocked)
                    .map(memberId => {
                        const user = usersMap[memberId] || {};
                        const displayName = user.nickName || user.fullName || user.displayName || user.email || "Unknown";
                        return {
                            id: memberId,
                            displayName,
                            emoji: user.emoji || "",
                            photoURL: user.photoURL || null,
                            score: scoresMap[memberId] || 0
                        };
                    });

                // Sort alphabetically by displayName
                mappedPeers.sort((a, b) => a.displayName.localeCompare(b.displayName));

                setPeers(mappedPeers);
            } catch (error) {
                console.error("Error fetching peers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPeers();
    }, [group]);

    const filteredPeers = peers.filter(peer =>
        peer.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen p-4 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="min-h-screen bg-transparent p-3 sm:p-4 lg:p-6 flex items-center justify-center transition-colors duration-300">
                <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl">
                    <UsersIcon className="w-16 h-16 mb-6 text-slate-300 dark:text-slate-600" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">No Batch Mates Yet</h2>
                    <p className="text-lg text-center max-w-sm">You need to join or create a group to see your peers here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent p-3 sm:p-4 lg:p-6 transition-colors duration-300">
            <div className="max-w-[1600px] w-full mx-auto space-y-8 animate-fadeIn">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-200/50 dark:border-white/5 transition-colors duration-300 relative overflow-hidden">
                    {/* Background glows */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/50 dark:border-slate-700/50 shrink-0">
                            <UsersIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Batch Mates</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
                                {peers.length} members in {group.groupName}
                            </p>
                        </div>
                    </div>

                    <div className="w-full sm:w-auto relative z-10">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search peers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm transition-all duration-200"
                            />
                        </div>
                    </div>
                </div>

                {/* Peers List */}
                {filteredPeers.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <UsersIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">No mates found matching your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredPeers.map((peer, index) => (
                            <Link
                                key={peer.id}
                                to={`/dashboard/profile/${peer.id}`}
                                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200/50 dark:border-white/5 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center justify-center gap-4 text-center relative overflow-hidden"
                            >
                                {/* Rank Badge */}
                                <div className="absolute top-5 left-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-extrabold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm z-10">
                                    #{index + 1}
                                </div>

                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                {/* Avatar */}
                                <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-600 dark:to-purple-700 shrink-0 mt-4 relative z-10 group-hover:scale-105 transition-transform duration-300">
                                    {peer.photoURL ? (
                                        <img src={peer.photoURL} alt={peer.displayName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-black text-white">
                                            {peer.displayName.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex flex-col items-center relative z-10 w-full px-2">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-center gap-2 w-full truncate">
                                        <span className="truncate">{peer.displayName}</span>
                                        {peer.emoji && <span className="text-2xl leading-none shrink-0">{peer.emoji}</span>}
                                    </h3>
                                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-100 dark:border-indigo-500/20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                                        <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Points</span>
                                        <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">{peer.score}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Peers;
