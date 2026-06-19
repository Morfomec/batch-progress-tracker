import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isStreakBroken } from "../../utils/streakUtils";

export default function LeetCodeLeaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch top 20 users with a LeetCode streak > 0
    const q = query(
      collection(db, "users"),
      where("leetcodeStreak", ">", 0),
      orderBy("leetcodeStreak", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        let streak = data.leetcodeStreak || 0;
        
        // Filter out broken streaks immediately on the client side
        if (streak > 0 && isStreakBroken(streak, data.lastLeetcodeSolve)) {
          streak = 0;
        }

        return {
          id: doc.id,
          name: data.fullName || data.nickName || data.displayName || "Unknown User",
          photoURL: data.photoURL || null,
          streak: streak
        };
      })
      .filter(u => u.streak > 0)
      .sort((a, b) => b.streak - a.streak); // Re-sort since some might be zeroed out
      
      setLeaders(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching LeetCode leaderboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full flex flex-col bg-white dark:bg-[#0a0a0a] rounded-2xl md:rounded-[2rem] border-[3px] border-amber-500 shadow-[0_10px_30px_rgba(245,158,11,0.15)] dark:shadow-[0_0_20px_rgba(245,158,11,0.15)] overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center gap-3 p-4 md:p-5 border-b border-slate-100 dark:border-white/5 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-amber-600 dark:text-amber-500" />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-white tracking-wide text-lg">LeetCode Streaks</h3>
      </div>

      {/* List */}
      <div className="overflow-y-auto p-3 custom-scrollbar flex flex-col gap-2 max-h-[60vh]">
        {loading ? (
          <div className="text-center py-10 text-slate-500 font-medium text-sm">Loading...</div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-medium text-[15px]">
             No streaks awarded yet.
          </div>
        ) : (
          leaders.map((user, index) => (
            <div 
              key={user.id}
              onClick={() => navigate(`/dashboard/profile/${user.id}`)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-white/10 group-hover:border-amber-400 dark:group-hover:border-amber-500/50 transition-colors">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-[15px] group-hover:text-amber-600 dark:group-hover:text-amber-100 transition-colors line-clamp-1">{user.name}</span>
              </div>
              <div className="flex items-center shrink-0 pl-3">
                <span className="font-black text-amber-500 text-base">{user.streak}🔥</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
