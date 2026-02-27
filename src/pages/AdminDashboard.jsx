import { useEffect, useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { ShieldCheck, Users, BookOpen, ChevronRight, Activity } from "lucide-react";
import { Link } from "react-router-dom";

function AdminDashboard() {
    const [stats, setStats] = useState({ totalUsers: 0, totalGroups: 0 });
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            setLoading(true);
            try {
                // Fetch Users
                const usersSnap = await getDocs(collection(db, "users"));
                const totalUsers = usersSnap.size;

                // Fetch Groups
                const groupsQuery = query(collection(db, "groups"), orderBy("createdAt", "desc"));
                const groupsSnap = await getDocs(groupsQuery);
                const totalGroups = groupsSnap.size;

                // We need to fetch the member count for each group to display it
                const groupData = await Promise.all(groupsSnap.docs.map(async (groupDoc) => {
                    const progressSnap = await getDocs(collection(db, "groups", groupDoc.id, "progress"));

                    // Count unique users who have made progress in this group
                    const uniqueUsers = new Set();
                    progressSnap.docs.forEach(doc => {
                        uniqueUsers.add(doc.data().userId);
                    });

                    return {
                        id: groupDoc.id,
                        ...groupDoc.data(),
                        activeMembers: uniqueUsers.size,
                    };
                }));

                setStats({ totalUsers, totalGroups });
                setGroups(groupData);

            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">

                {/* Header */}
                {/* Header */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-2xl border border-slate-200/50 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-sm border border-rose-100 dark:border-rose-800">
                            <ShieldCheck className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Admin Dashboard</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Platform Overview & Management</p>
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] p-6 border border-slate-200/50 dark:border-white/5 shadow-xl flex items-center gap-6 group hover:-translate-y-1 transition-all duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shadow-sm border border-indigo-100 dark:border-indigo-800 group-hover:scale-110 transition-transform">
                            <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Users</p>
                            <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{stats.totalUsers}</p>
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] p-6 border border-slate-200/50 dark:border-white/5 shadow-xl flex items-center gap-6 group hover:-translate-y-1 transition-all duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shadow-sm border border-emerald-100 dark:border-emerald-800 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Batches</p>
                            <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{stats.totalGroups}</p>
                        </div>
                    </div>
                </div>

                {/* Groups List */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-white/5 overflow-hidden transition-colors duration-300">
                    <div className="px-6 py-5 border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                            Manage Batches
                        </h2>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-left">
                        {groups.map((group) => (
                            <Link
                                key={group.id}
                                to={`/admin/groups/${group.id}`}
                                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/row"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm group-hover/row:scale-105 transition-transform">
                                        {(group.groupName || "G").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{group.groupName}</p>
                                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">ID: {group.id}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{group.activeMembers}</p>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Users</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover/row:text-indigo-500 transition-colors" />
                                </div>
                            </Link>
                        ))}

                        {groups.length === 0 && (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                No groups created yet.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AdminDashboard;
