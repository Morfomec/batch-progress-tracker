import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet, useOutletContext } from "react-router-dom";
import { useState } from "react";

function AppLayout() {
  const groupContext = useOutletContext() || {};
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out w-80 shrink-0 shadow-sm border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        <Sidebar groupContext={groupContext} onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto w-full relative">
          <Outlet context={groupContext} />
        </main>
      </div>

    </div>
  );
}

export default AppLayout;