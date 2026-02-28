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
            <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8 flex items-center justify-center transition-colors duration-300">
                <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl">
                    <UsersIcon className="w-16 h-16 mb-6 text-slate-300 dark:text-slate-600" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">No Batch Mates Yet</h2>
                    <p className="text-lg text-center max-w-sm">You need to join or create a group to see your peers here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-[1600px] w-full mx-auto space-y-8 animate-fadeIn">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-200/50 dark:border-white/5 transition-colors duration-300 relative overflow-hidden sm:h-36">
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
                    <div className="flex flex-col gap-4">
                        {filteredPeers.map((peer, index) => (
                            <Link
                                key={peer.id}
                                to={`/dashboard/profile/${peer.id}`}
                                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-4 sm:p-6 border border-slate-200/50 dark:border-white/5 shadow-xl hover:-translate-y-1 transition-all duration-300 group flex items-center justify-between gap-4"
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
