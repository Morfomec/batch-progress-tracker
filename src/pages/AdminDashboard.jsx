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
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-rose-600 to-orange-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
                            <p className="text-rose-100 font-medium mt-1">Platform Overview & Management</p>
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6 group hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Users</p>
                            <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{stats.totalUsers}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6 group hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Batches</p>
                            <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{stats.totalGroups}</p>
                        </div>
                    </div>
                </div>

                {/* Groups List */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
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
                                        {group.groupName.charAt(0).toUpperCase()}
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
