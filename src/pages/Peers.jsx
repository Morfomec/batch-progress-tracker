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
            if (!group) return;

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
                const mappedPeers = groupMembers.map(memberId => {
                    const user = usersMap[memberId] || {};
                    const displayName = user.nickName || user.fullName || user.displayName || user.email || "Unknown Student";
                    return {
                        id: memberId,
                        displayName,
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
            <div className="min-h-screen p-8 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400">
                <UsersIcon className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No Group selected</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center shadow-sm">
                            <UsersIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Batch Mates</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                {peers.length} members in {group.groupName}
                            </p>
                        </div>
                    </div>

                    <div className="w-full sm:w-auto">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search peers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
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
                    <div className="flex flex-col gap-4">
                        {filteredPeers.map((peer, index) => (
                            <Link
                                key={peer.id}
                                to={`/dashboard/profile/${peer.id}`}
                                className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-8 flex justify-center text-lg font-bold text-slate-400 dark:text-slate-500">
                                        #{index + 1}
                                    </div>
                                    <div className="w-14 h-14 rounded-full border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-600 dark:to-purple-700 shrink-0">
                                        {peer.photoURL ? (
                                            <img src={peer.photoURL} alt={peer.displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-bold text-white">
                                                {peer.displayName.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {peer.displayName}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-0.5">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                Total Points: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{peer.score}</span>
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-1 text-sm font-semibold text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0">
                                    View Profile <ChevronRight className="w-4 h-4" />
                                </div>
                                <div className="sm:hidden flex items-center shrink-0">
                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
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
