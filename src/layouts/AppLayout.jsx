import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet, useOutletContext } from "react-router-dom";

function AppLayout() {
  const groupContext = useOutletContext() || {};

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">

      {/* Sidebar Container */}
      <div className="hidden sm:block w-80 shrink-0 z-20 shadow-sm border-r border-slate-200 dark:border-slate-800">
        <Sidebar groupContext={groupContext} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Topbar />

        <main className="flex-1 overflow-y-auto w-full relative">
          <Outlet context={groupContext} />
        </main>
      </div>

    </div>
  );
}

export default AppLayout;