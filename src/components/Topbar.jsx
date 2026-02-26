import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, User as UserIcon, Settings, LogOut } from "lucide-react";
import { auth } from "../firebase/firebaseConfig";

function Topbar() {
  const { user, userProfile } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-[90px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b-2 border-slate-200 dark:border-slate-800 flex items-center justify-end px-8 shadow-sm transition-colors duration-300 sticky top-0 z-50">

      {/* RIGHT USER */}
      <div className="flex items-center gap-6">

        {/* THEME TOGGLE */}
        <div className="pr-8 border-r-2 border-slate-200 dark:border-slate-800">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* USER INFO */}
        <div className="text-right hidden sm:block">
          <p className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {userProfile?.nickName || userProfile?.fullName || user?.displayName || "User"}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {user?.email || "No email"}
          </p>
        </div>

        {/* AVATAR & DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white flex items-center justify-center text-lg font-bold shadow-md border-2 border-white dark:border-slate-800 hover:scale-105 transition-transform"
          >
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span>
                {userProfile?.nickName
                  ? userProfile.nickName.charAt(0).toUpperCase()
                  : user?.email?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </button>

          {/* DROPDOWN MENU */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-indigo-900/20 border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-fadeIn">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {userProfile?.fullName || user?.displayName || "User"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {user?.email}
                </p>
              </div>

              <div className="py-2">
                <Link
                  to="/dashboard/my-profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <UserIcon className="w-4 h-4" /> My Profile
                </Link>
                <Link
                  to="/dashboard/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Settings className="w-4 h-4" /> Account Settings
                </Link>
              </div>

              <div className="py-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

export default Topbar;