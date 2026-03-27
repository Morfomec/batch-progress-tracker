import { Zap, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEnglishKicks } from "../hooks/useEnglishKicks";

function KicksBoard({ groupId }) {
    const { user, isAdmin } = useAuth();

    const {
        kicks,
        coordinator,
        ownerId,
        handleAddPoint,
        handleMinusPoint
    } = useEnglishKicks(groupId);

    const isBatchAdmin = ownerId === user?.uid;
    const isAuthorized = isAdmin || isBatchAdmin || (coordinator && user?.uid === coordinator);

    return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl md:rounded-[2rem] shadow-xl border border-slate-200/50 dark:border-white/5 overflow-hidden relative h-full flex flex-col transition-colors duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/3 -translate-y-1/3" />

            <div className="px-4 py-4 border-b border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-indigo-900 dark:from-slate-100 dark:to-indigo-300 bg-clip-text text-transparent flex items-center gap-2">
                    <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    English Kicks
                </h2>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full uppercase tracking-wider">
                    CURRENT WEEK
                </div>
            </div>

            <div className="p-2 sm:p-3 flex-1 overflow-y-auto custom-scrollbar max-h-[500px]">
                {kicks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="relative mb-6 group">
                            <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                            <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-[2rem] shadow-xl border border-indigo-100/50 dark:border-slate-700/50 flex items-center justify-center rotate-3 group-hover:rotate-6 transition-transform duration-500">
                                <Zap className="w-12 h-12 text-indigo-400 dark:text-indigo-500 -rotate-3 group-hover:-rotate-6 transition-transform duration-500" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Kicks Yet!</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto text-sm leading-relaxed">
                            Looks like things are quiet right now. Check back later when the action starts!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {kicks.map((userData, index) => {
                            return (
                                <div
                                    key={userData.userId}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 hover:shadow-md hover:scale-[1.01] dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900 border-transparent`}
                                >
                                    <div className="flex items-center gap-2 sm:gap-4">
                                        <Link to={`/dashboard/profile/${userData.userId}`} className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0">
                                            <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-600 dark:to-purple-700 overflow-hidden">
                                                {userData.photoURL ? (
                                                    <img src={userData.photoURL} alt={userData.userName} className="w-full h-full object-cover" />
                                                ) : (
                                                    (userData.userName || "U").charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold flex items-center gap-1 sm:gap-1.5 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-slate-700 dark:text-slate-300 truncate">
                                                    <span className="truncate">{userData.userName}</span>
                                                    {userData.emoji && <span className="text-base sm:text-lg leading-none shrink-0">{userData.emoji}</span>}
                                                </p>
                                            </div>
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-4 shrink-0 pl-2">
                                        <div className="text-right">
                                            <p className="text-xl font-black tracking-tight text-amber-600 dark:text-amber-400">
                                                {userData.points}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                                Kicks
                                            </p>
                                        </div>
                                        {isAuthorized && (
                                            <div className="flex items-center gap-1.5 ml-2">
                                                <button
                                                    onClick={() => handleMinusPoint(userData.userId, userData.points)}
                                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors border ${userData.points > 0 ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-pointer' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800/50 cursor-not-allowed'} font-bold`}
                                                    title="Subtract 1 Point"
                                                    disabled={userData.points <= 0}
                                                >
                                                    -
                                                </button>
                                                <button
                                                    onClick={() => handleAddPoint(userData.userId, userData.points)}
                                                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center transition-colors shadow-sm"
                                                    title="Add Point"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default KicksBoard;
