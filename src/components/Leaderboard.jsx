import { useEffect, useState } from "react";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Trophy, Medal, Award } from "lucide-react";
import { Link } from "react-router-dom";

function Leaderboard({ groupId }) {
    const [leaders, setLeaders] = useState([]);

    useEffect(() => {
        if (!groupId) return;

        const unsubscribe = onSnapshot(
            collection(db, "groups", groupId, "progress"),
            async (snapshot) => {
                const allProgress = snapshot.docs.map(doc => doc.data());

                const usersSnap = await getDocs(collection(db, "users"));
                const privacyMap = {};
                const nameMap = {};
                usersSnap.docs.forEach(d => {
                    const data = d.data();
                    privacyMap[d.id] = data?.privacyMode || false;
                    nameMap[d.id] = data?.nickName || data?.fullName || data?.displayName || data?.email || "Unknown";
                });

                const totalsMap = {};

                allProgress.forEach(entry => {
                    if (privacyMap[entry.userId]) return;

                    if (!totalsMap[entry.userId]) {
                        totalsMap[entry.userId] = {
                            userId: entry.userId,
                            userName: nameMap[entry.userId] || entry.userName || "Unknown",
                            totalScore: 0
                        };
                    }
                    totalsMap[entry.userId].totalScore += entry.score || 0;
                });

                let totalsArray = Object.values(totalsMap);
                totalsArray.sort((a, b) => b.totalScore - a.totalScore);

                let currentRank = 1;
                let previousScore = null;

                totalsArray = totalsArray.map((user, index) => {
                    if (previousScore !== null && user.totalScore < previousScore) {
                        currentRank = index + 1;
                    }
                    previousScore = user.totalScore;

                    return {
                        ...user,
                        rank: currentRank
                    };
                });
                setLeaders(totalsArray);
            }
        );

        return () => unsubscribe();
    }, [groupId]);

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-4 h-4 text-amber-500 drop-shadow-sm" />;
            case 2:
                return <Medal className="w-4 h-4 text-slate-400 dark:text-slate-300 drop-shadow-sm" />;
            case 3:
                return <Medal className="w-4 h-4 text-amber-700 dark:text-amber-600 drop-shadow-sm" />;
            default:
                return null;
        }
    };

    const getRankBg = (rank) => {
        switch (rank) {
            case 1:
                return "bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20 border-l-4 border-l-amber-400 border-amber-100/50 dark:border-amber-900/30";
            case 2:
                return "bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50 border-l-4 border-l-slate-400 border-slate-200/50 dark:border-slate-700";
            case 3:
                return "bg-gradient-to-r from-orange-50 to-transparent dark:from-amber-900/10 border-l-4 border-l-amber-700 border-orange-100/50 dark:border-amber-900/20";
            default:
                return "bg-white dark:bg-slate-900 border-transparent border-l-4 border-l-transparent";
        }
    };

    return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] shadow-xl border border-slate-200/50 dark:border-white/5 overflow-hidden relative h-full flex flex-col transition-colors duration-300">

            {/* Soft decorative background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/3 -translate-y-1/3" />

            <div className="px-6 py-6 border-b border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-indigo-900 dark:from-slate-100 dark:to-indigo-300 bg-clip-text text-transparent flex items-center gap-2">
                    <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    Leaderboard
                </h2>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full uppercase tracking-wider">
                    All Time
                </div>
            </div>

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
                {leaders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 mb-4">
                            <Trophy className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">No progress data yet</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Submit progress to appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {leaders.map((user, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:shadow-md hover:scale-[1.01] dark:hover:bg-slate-800/50 ${getRankBg(user.rank)}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 flex items-center justify-center gap-1.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg py-1 px-2 border border-slate-100 dark:border-slate-800">
                                        <span className={`font-black text-sm ${user.rank === 1 ? 'text-amber-500' : user.rank === 2 ? 'text-slate-500 dark:text-slate-400' : user.rank === 3 ? 'text-amber-700 dark:text-amber-500' : 'text-slate-400'}`}>
                                            #{user.rank}
                                        </span>
                                        {getRankIcon(user.rank)}
                                    </div>
                                    <Link to={`/dashboard/profile/${user.userId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${user.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                                            user.rank === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                                                user.rank === 3 ? 'bg-gradient-to-br from-amber-700 to-amber-800' :
                                                    'bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-600 dark:to-purple-700'
                                            }`}>
                                            {user.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className={`font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${user.rank <= 3 ? 'text-slate-800 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {user.userName}
                                            </p>
                                        </div>
                                    </Link>
                                </div>

                                <div className="text-right">
                                    <p className={`text-xl font-black tracking-tight ${user.rank === 1 ? 'text-amber-500' :
                                        user.rank === 2 ? 'text-slate-600 dark:text-slate-300' :
                                            user.rank === 3 ? 'text-amber-700 dark:text-amber-500' :
                                                'text-indigo-600 dark:text-indigo-400'
                                        }`}>
                                        {user.totalScore}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                        Pts
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Leaderboard;