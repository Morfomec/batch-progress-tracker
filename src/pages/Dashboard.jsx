// import { signOut } from "firebase/auth";
// import { auth, db } from "../firebase/firebaseConfig";
// import { useNavigate, Link, useOutletContext } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { collection, getDocs, orderBy, query, addDoc, serverTimestamp, Firestore } from "firebase/firestore";
// import { useEffect, useState } from "react";
// import { calculateScore } from "../utils/calculateScore";
// import Leaderboard from "../components/Leaderboard";


// function Dashboard() {

//     const navigate = useNavigate();
//     const { user } = useAuth();
//     const { group } = useOutletContext();

//     const [showForm, setShowForm] = useState(false);
//     const [formData, setFormData] = useState({
//         moduleNo: "",
//         examStatus: "",
//         linkedinActivity:"",
//         linkedinCount:"",
//         postLink:"",
//     });

//     const [latestUpdates, setLatestUpdates] = useState([]);



//     // to fetch the details of latest members to the Dashboard
//     useEffect(() => { 
//         const fetchLatest = async () => {
//             if (!group) return;

//             const q = query(
//                 collection(db, "groups", group.id, "progress"),
//                 orderBy("createdAt", "desc")
//             );

//             const snapshot = await getDocs(q);

//             const all = snapshot.docs.map(doc => ({
//                 id: doc.id,
//                 ...doc.data()
//             }));

//             // to keep only latest entry per user

//             const map = {};
//             all.forEach(entry => {
//                 if(!map[entry.userId]) {
//                     map[entry.userId] = entry;
//                 }
//             });
//             setLatestUpdates(Object.values(map));
//         };



//         fetchLatest();
//     }, [group]);

//     // handle input change
//     const handleChange = (e) => {
//         setFormData({
//             ...formData,
//             [e.target.name]: e.target.value
//         });
//     };

//     // handle submit
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         // console.log("Progress Data:", formData);
//         // alert("Progress captured");
//         // setShowForm(false);

//         if(!group) {
//             alert("No group found");
//             return;
//         }

//         try {

//             // calculating the scores here 
//             const score = calculateScore(
//                 formData.examStatus,
//                 formData.linkedinActivity,
//             );

//             // storeing score in Firestore
//             await addDoc(collection(db, "groups", group.id, "progress"),
//             {
//                 userId: user.uid,
//                 userName: user.displayName || user.email,
//                 moduleNo: Number(formData.moduleNo),
//                 examStatus: formData.examStatus,
//                 linkedinActivity: formData.linkedinActivity,
//                 linkedinCount: formData.linkedinCount || 0,
//                 postLink: formData.postLink,
//                 score: score,
//                 createdAt: serverTimestamp(),
//             }
//             );

//             alert("Progress saved successfully!");

//             setFormData({
//                 moduleNo: "",
//                 examStatus: "",
//                 linkedinActivity: "",
//                 linkedinCount: "",
//                 postLink: "",
//             });

//             setShowForm(false);
//         } catch (error) {
//             console.error("Save error:", error);
//             alert("Failed tp save progress");
//         }
//     };

//     const handleLogout = async () => {
//         await signOut(auth);
//         navigate("/");
//     };

//     return (

//             <div>
//                 {/* <h1>Dashboard</h1> */}
//                 {/* <h2>Welcome {user?.email}</h2> */}

//                 {group ? (
//                     <h2>Group: {group.groupName}</h2>
//                 ) : (
//                     <p>You are not in any group.</p>
//                 )}
//             {group && <Leaderboard groupId={group.id} />}

//             <h2>Batch Progress</h2>

//             {latestUpdates.length === 0 ? (
//                 <p>No submissions yet</p>
//                 ) : (
//                 <table style={{ width: "100%", marginTop: 20, borderCollapse: "collapse" }}>
//                     <thead>
//                     <tr style={{ borderBottom: "2px solid #555" }}>
//                         <th>S.No</th>
//                         <th>Name</th>
//                         <th>Module</th>
//                         <th>Exam Status</th>
//                         <th>LinkedIn Activity</th>
//                         <th>Connections</th>
//                         <th>Date</th>
//                     </tr>
//                     </thead>

//                     <tbody>
//                     {latestUpdates.map((item, index) => (
//                         <tr key={item.id} style={{ textAlign: "center" }}>
//                         <td>{index + 1}</td>
//                         <td>{item.userName}</td>
//                         <td>{item.moduleNo}</td>
//                         <td>{item.examStatus}</td>
//                         <td>{item.linkedinActivity}</td>
//                         <td>{item.linkedinCount}</td>
//                         <td>
//                             {item.createdAt?.toDate
//                             ? item.createdAt.toDate().toLocaleDateString()
//                             : "—"}
//                         </td>
//                         </tr>
//                     ))}
//                     </tbody>
//                 </table>
//             )}


//             <button onClick={()=> setShowForm(!showForm)}>
//                 {showForm ? "Close Form" : "Add Weekly Progress"}
//             </button>
//             {showForm && (
//                 <form 
//                     onSubmit={handleSubmit}
//                     style={{
//                         marginTop: "20px",
//                         padding: "20px",
//                         border: "1px solid #444",
//                         borderRadius: "8px",
//                         maxWidth: "400px"
//                     }}
//                 >
//                     <h3>Weekly Progress</h3>

//                     <input type="number" name="moduleNo" placeholder="Module Number" value={formData.moduleNo} onChange={handleChange} required />

//                     <br /><br />

//                     <select name="examStatus" value={formData.examStatus} onChange={handleChange} required>

//                         <option value="">Exam Status</option>
//                         <option value="Passed">Passed</option>
//                         <option value="Repeat">Repeat</option>
//                         <option value="Reschedule">Rescheduled</option>

//                     </select>

//                     <br /><br />

//                     <select name="linkedinActivity" value={formData.linkedinActivity} onChange={handleChange} required>

//                         <option value="">Linked Activity</option>
//                         <option value="Posted">Posted</option>
//                         <option value="Commented">Commented</option>
//                         <option value="Shared">Shared</option>
//                         <option value="None">None</option>

//                     </select>
//                     <br /><br />
//                     <input type="number" name="linkedinCount" placeholder="LinkedIn Connection Count" value={formData.linkedinCount} onChange={handleChange} />
//                     <br /><br />
//                     <input type="text" name="postLink" placeholder="Post Link" value={formData.postLink} onChange={handleChange} />
//                     {/* <br /><br />
//                     <textarea  name="suggestions" placeholder="Suggestions" value={formData.suggestions} onChange={handleChange} /> */}
//                     <br /><br />
//                     <button type="submit">Submit Progress</button>


//                 </form>
//             )}
//             <br />

//             <Link to="/dashboard/my-progress"><button>My Progress</button></Link>
//             {/* <button onClick={handleLogout}>Logout</button> */}
//         </div>
//     );
// }

// export default Dashboard;



import { LogOut } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { calculateScore } from "../utils/calculateScore";
import Leaderboard from "../components/Leaderboard";
import { PlusCircle, Target, Users as UsersIcon, Activity, ChevronRight, BarChart, Copy, CheckCircle2, ChevronDown, Calendar, Clock, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

function Dashboard() {
    const { user, userProfile } = useAuth();
    const { group, groups, selectGroup } = useOutletContext();
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        moduleNo: "",
        examStatus: "",
        linkedinActivity: "",
        linkedinCount: "",
        postLink: "",
    });

    const [latestUpdates, setLatestUpdates] = useState([]);
    const [copiedContent, setCopiedContent] = useState(false);

    const handleCopyCode = () => {
        if (group?.groupCode) {
            navigator.clipboard.writeText(group.groupCode);
            setCopiedContent(true);
            toast.success("Batch code copied!");
            setTimeout(() => setCopiedContent(false), 2000);
        } else if (group?.id) {
            navigator.clipboard.writeText(group.id);
            setCopiedContent(true);
            toast.success("Batch code copied!");
            setTimeout(() => setCopiedContent(false), 2000);
        }
    };

    // Timeline State Options
    const [timelineData, setTimelineData] = useState([]);

    useEffect(() => {
        const fetchLatest = async () => {
            if (!group) return;

            const q = query(
                collection(db, "groups", group.id, "progress"),
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(q);

            const all = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Fetch users to map the latest name
            const usersSnap = await getDocs(collection(db, "users"));
            const nameMap = {};
            usersSnap.docs.forEach(d => {
                const data = d.data();
                nameMap[d.id] = data?.nickName || data?.fullName || data?.displayName || data?.email || "Unknown";
            });

            const map = {};
            all.forEach(entry => {
                if (!map[entry.userId]) {
                    // Override the static name with the dynamic one if available
                    if (nameMap[entry.userId]) {
                        entry.userName = nameMap[entry.userId];
                    }
                    map[entry.userId] = entry;
                }
            });
            const finalUpdates = Object.values(map);
            finalUpdates.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            setLatestUpdates(finalUpdates);

            // Timeline Calculation for all group members
            const allTimelinesMap = {};
            (group.members || []).forEach(memberId => {
                allTimelinesMap[memberId] = {
                    userId: memberId,
                    userName: nameMap[memberId] || "Unknown Student",
                    highestModule: 0,
                    delays: 0,
                    latestDate: null
                };
            });

            all.forEach(entry => {
                if (!allTimelinesMap[entry.userId]) {
                    allTimelinesMap[entry.userId] = {
                        userId: entry.userId,
                        userName: nameMap[entry.userId] || entry.userName || "Unknown",
                        highestModule: 0,
                        delays: 0,
                        latestDate: null
                    };
                }
                const stats = allTimelinesMap[entry.userId];
                if (entry.moduleNo > stats.highestModule) {
                    stats.highestModule = entry.moduleNo;
                }
                if (entry.createdAt) {
                    const entryDate = entry.createdAt.toDate();
                    if (!stats.latestDate || entryDate > stats.latestDate) {
                        stats.latestDate = entryDate;
                    }
                }
                if (entry.examStatus === "Repeat" || entry.examStatus === "Reschedule") {
                    stats.delays += 1;
                }
            });

            const batchStartDate = group.createdAt?.toDate ? group.createdAt.toDate() : new Date(group.createdAt || Date.now());

            const timelineArray = Object.values(allTimelinesMap).map(stats => {
                // 1. Calculate official date for Module N
                let officialDate = new Date(batchStartDate);
                const nCycles = Math.floor(stats.highestModule / 6);
                const nSingles = stats.highestModule % 6;
                officialDate.setDate(officialDate.getDate() + (nCycles * 49));
                for (let i = 0; i < nSingles; i++) {
                    officialDate.setDate(officialDate.getDate() + 8);
                    if (officialDate.getDay() === 0) officialDate.setDate(officialDate.getDate() + 1);
                }

                // 2 & 3. Calculate Base End Date from that official module date
                let expectedDate = new Date(officialDate);
                const remainingModules = Math.max(0, 52 - stats.highestModule);
                if (remainingModules > 0) {
                    const fullCycles = Math.floor(remainingModules / 6);
                    const singleModules = remainingModules % 6;
                    expectedDate.setDate(expectedDate.getDate() + (fullCycles * 49));
                    for (let i = 0; i < singleModules; i++) {
                        expectedDate.setDate(expectedDate.getDate() + 8);
                        if (expectedDate.getDay() === 0) expectedDate.setDate(expectedDate.getDate() + 1);
                    }
                }

                // 4. Add Delays / Reschedules logic explicitly
                for (let i = 0; i < stats.delays; i++) {
                    expectedDate.setDate(expectedDate.getDate() + 8);
                    if (expectedDate.getDay() === 0) expectedDate.setDate(expectedDate.getDate() + 1);
                }

                return {
                    ...stats,
                    expectedEndDate: expectedDate,
                    remainingDays: "Calculated" // Simplified since days vary based on Sundays
                };
            });

            timelineArray.sort((a, b) => a.expectedEndDate - b.expectedEndDate);
            setTimelineData(timelineArray);
        };

        fetchLatest();
    }, [group]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!group) {
            toast.error("No group found");
            return;
        }

        try {
            const score = calculateScore(
                formData.examStatus,
                formData.linkedinActivity,
            );

            await addDoc(collection(db, "groups", group.id, "progress"), {
                userId: user.uid,
                userName: userProfile?.nickName || userProfile?.fullName || user.displayName || user.email,
                moduleNo: Number(formData.moduleNo),
                examStatus: formData.examStatus,
                linkedinActivity: formData.linkedinActivity,
                linkedinCount: formData.linkedinCount || 0,
                postLink: formData.postLink,
                score: score,
                createdAt: serverTimestamp(),
            });



            setFormData({
                moduleNo: "",
                examStatus: "",
                linkedinActivity: "",
                linkedinCount: "",
                postLink: "",
            });

            setShowForm(false);

            // Re-fetch latest updates immediately
            const q = query(collection(db, "groups", group.id, "progress"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const usersSnap = await getDocs(collection(db, "users"));
            const nameMap = {};
            usersSnap.docs.forEach(d => {
                const data = d.data();
                nameMap[d.id] = data?.nickName || data?.fullName || data?.displayName || data?.email || "Unknown";
            });

            const map = {};
            const allTimelinesMap = {};

            (group.members || []).forEach(memberId => {
                allTimelinesMap[memberId] = {
                    userId: memberId,
                    userName: nameMap[memberId] || "Unknown Student",
                    highestModule: 0,
                    delays: 0,
                    latestDate: null
                };
            });

            all.forEach(entry => {
                if (!map[entry.userId]) {
                    if (nameMap[entry.userId]) {
                        entry.userName = nameMap[entry.userId];
                    }
                    map[entry.userId] = entry;
                }

                if (!allTimelinesMap[entry.userId]) {
                    allTimelinesMap[entry.userId] = {
                        userId: entry.userId,
                        userName: nameMap[entry.userId] || entry.userName || "Unknown",
                        highestModule: 0,
                        delays: 0,
                        latestDate: null
                    };
                }
                const stats = allTimelinesMap[entry.userId];
                if (entry.moduleNo > stats.highestModule) {
                    stats.highestModule = entry.moduleNo;
                }
                if (entry.createdAt) {
                    const entryDate = entry.createdAt.toDate();
                    if (!stats.latestDate || entryDate > stats.latestDate) {
                        stats.latestDate = entryDate;
                    }
                }
                if (entry.examStatus === "Repeat" || entry.examStatus === "Reschedule") {
                    stats.delays += 1;
                }
            });

            const finalUpdatesAfterSubmit = Object.values(map);
            finalUpdatesAfterSubmit.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            setLatestUpdates(finalUpdatesAfterSubmit);

            const batchStartDate = group.createdAt?.toDate ? group.createdAt.toDate() : new Date(group.createdAt || Date.now());

            const timelineArray = Object.values(allTimelinesMap).map(stats => {
                // 1. Calculate official date for Module N
                let officialDate = new Date(batchStartDate);
                const nCycles = Math.floor(stats.highestModule / 6);
                const nSingles = stats.highestModule % 6;
                officialDate.setDate(officialDate.getDate() + (nCycles * 49));
                for (let i = 0; i < nSingles; i++) {
                    officialDate.setDate(officialDate.getDate() + 8);
                    if (officialDate.getDay() === 0) officialDate.setDate(officialDate.getDate() + 1);
                }

                // 2 & 3. Calculate Base End Date from that official module date
                let expectedDate = new Date(officialDate);
                const remainingModules = Math.max(0, 52 - stats.highestModule);
                if (remainingModules > 0) {
                    const fullCycles = Math.floor(remainingModules / 6);
                    const singleModules = remainingModules % 6;
                    expectedDate.setDate(expectedDate.getDate() + (fullCycles * 49));
                    for (let i = 0; i < singleModules; i++) {
                        expectedDate.setDate(expectedDate.getDate() + 8);
                        if (expectedDate.getDay() === 0) expectedDate.setDate(expectedDate.getDate() + 1);
                    }
                }

                // 4. Add Delays / Reschedules logic explicitly
                for (let i = 0; i < stats.delays; i++) {
                    expectedDate.setDate(expectedDate.getDate() + 8);
                    if (expectedDate.getDay() === 0) expectedDate.setDate(expectedDate.getDate() + 1);
                }

                return {
                    ...stats,
                    expectedEndDate: expectedDate,
                    remainingDays: "Calculated"
                };
            });

            timelineArray.sort((a, b) => a.expectedEndDate - b.expectedEndDate);
            setTimelineData(timelineArray);

            toast.success("Progress saved successfully!");

        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save progress");
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* 1. Group Info Header Card */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-indigo-50 text-xs font-semibold tracking-wide uppercase mb-4">
                                <Target className="w-4 h-4" /> Active Batch
                            </div>
                            {group ? (
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{group.groupName}</h1>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <p className="text-indigo-100/80 text-sm font-medium">Batch Code:</p>
                                        <button
                                            onClick={handleCopyCode}
                                            className="flex items-center gap-2 bg-black/20 hover:bg-black/30 text-white px-3 py-1.5 rounded-lg text-sm font-bold tracking-widest transition-colors border border-white/10 uppercase font-mono"
                                            title="Click to copy invite code"
                                        >
                                            {group.groupCode || group.id}
                                            {copiedContent ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-200" />}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xl text-indigo-100">You are not in any group yet.</p>
                            )}
                        </div>
                        {group && (
                            <div className="flex gap-4">
                                <Link to="/dashboard/peers" className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[120px] hover:bg-white/20 transition-all duration-300 group cursor-pointer block">
                                    <div className="text-3xl font-bold mb-1 group-hover:scale-110 transition-transform">{group.members?.length || 0}</div>
                                    <div className="text-indigo-100 text-xs font-medium uppercase tracking-wider group-hover:text-white transition-colors">Total Mates</div>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {group && (
                    <div className="space-y-8">
                        {/* 2. Top Row: Action / Form */}
                        <div className="w-full">

                            {!showForm ? (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px] transition-colors duration-300">
                                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                                        <Activity className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Track Your Journey</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
                                        Stay accountable. Add your latest module progress and LinkedIn activity here.
                                    </p>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <PlusCircle className="w-5 h-5" />
                                        Log Weekly Progress
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 animate-fadeIn transition-colors duration-300">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                            <PlusCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                            Weekly Progress
                                        </h3>
                                        <button onClick={() => setShowForm(false)} className="text-sm font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                                            Cancel
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Module Number</label>
                                            <input
                                                type="number"
                                                name="moduleNo"
                                                placeholder="e.g. 25"
                                                value={formData.moduleNo}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Exam Status</label>
                                                <select
                                                    name="examStatus"
                                                    value={formData.examStatus}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition appearance-none"
                                                    required
                                                >
                                                    <option value="">Select status</option>
                                                    <option value="Passed">Passed</option>
                                                    <option value="Repeat">Repeat</option>
                                                    <option value="Reschedule">Rescheduled</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">LinkedIn Activity</label>
                                                <select
                                                    name="linkedinActivity"
                                                    value={formData.linkedinActivity}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition appearance-none"
                                                    required
                                                >
                                                    <option value="">Select activity</option>
                                                    <option value="Posted">Posted</option>
                                                    <option value="Commented">Commented</option>
                                                    <option value="Shared">Shared</option>
                                                    <option value="None">None</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Connection Count</label>
                                                <input
                                                    type="number"
                                                    name="linkedinCount"
                                                    placeholder="Total connections"
                                                    value={formData.linkedinCount}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Post Link (Optional)</label>
                                                <input
                                                    type="text"
                                                    name="postLink"
                                                    placeholder="URL"
                                                    value={formData.postLink}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 mt-2 rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                                        >
                                            <Target className="w-5 h-5" />
                                            Submit Progress
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* 3. Bottom Row: Leaderboard (Left) & Timeline (Right) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                            <Leaderboard groupId={group.id} />

                            {/* Timeline Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden relative h-full flex flex-col transition-colors duration-300">
                                <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                                    <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-indigo-900 dark:from-slate-100 dark:to-indigo-300 bg-clip-text text-transparent flex items-center gap-2">
                                        <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        Timeline
                                    </h2>
                                </div>

                                <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
                                    {timelineData.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 mb-4">
                                                <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 font-medium">No batch timeline available</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {timelineData.map(userStats => (
                                                <div key={userStats.userId} className="flex items-center justify-between p-4 rounded-xl border border-transparent bg-slate-50/50 dark:bg-slate-900/30 transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-600 dark:to-purple-700 flex items-center justify-center text-white font-bold shadow-sm">
                                                            {userStats.userName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-slate-700 dark:text-slate-300">{userStats.userName}</span>
                                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                                                                {Math.max(0, 52 - userStats.highestModule)} Modules Left
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                                                            {userStats.expectedEndDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                                            End Date
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* 4. Batch Progress History */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                    <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                            <BarChart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            Recent Batch Activity
                        </h2>
                        <Link to="/dashboard/my-progress" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                            View My History <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="p-0 sm:p-4">
                        {latestUpdates.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 mb-4">
                                    <UsersIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 font-semibold text-lg">No activity yet</p>
                                <p className="text-sm text-slate-400 mt-1">Be the first to log progress in this batch!</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Student</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Module</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">LinkedIn</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {latestUpdates.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <Link to={`/dashboard/profile/${item.userId}`} className="flex items-center gap-4 group-hover:opacity-90 transition-opacity">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-600 dark:to-purple-700 flex items-center justify-center text-white font-bold shadow-sm">
                                                            {item.userName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{item.userName}</span>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                                                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : "Just now"}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                        Module {item.moduleNo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${item.examStatus === 'Passed' ? 'bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400' :
                                                        item.examStatus === 'Repeat' ? 'bg-amber-100/80 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400' :
                                                            'bg-sky-100/80 dark:bg-sky-500/20 text-sky-800 dark:text-sky-400'
                                                        }`}>
                                                        {item.examStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    {item.linkedinActivity}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400">{item.score || 0}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div >
    );
}

export default Dashboard;