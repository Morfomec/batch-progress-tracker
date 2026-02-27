import { useOutletContext, useNavigate } from "react-router-dom";
import { Users, Copy, CheckCircle2, Info, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import { db } from "../firebase/firebaseConfig";
import { doc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore";
import toast from "react-hot-toast";

function GroupInfo() {
  const { group, selectGroup, groups } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const [modalType, setModalType] = useState(null); // 'leave' or 'delete'

  const isOwner = group?.ownerId === user?.uid;

  if (!group) return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400">
      <Info className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-lg font-medium">No Group selected</p>
    </div>
  );

  const copyToClipboard = () => {
    navigator.clipboard.writeText(group.groupCode);
    setCopied(true);
    toast.success("Batch code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveBatch = async () => {
    try {
      await updateDoc(doc(db, "groups", group.id), {
        members: arrayRemove(user.uid)
      });
      toast.success("You have left the batch.");

      // Switch to another group or navigate away
      const nextGroup = groups.find(g => g.id !== group.id);
      if (nextGroup) {
        selectGroup(nextGroup);
      } else {
        selectGroup(null);
        localStorage.removeItem("activeGroupId");
      }
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to leave the batch.");
      console.error(error);
    } finally {
      setModalType(null);
    }
  };

  const handleDeleteBatch = async () => {
    try {
      await deleteDoc(doc(db, "groups", group.id));
      toast.success("Batch permanently deleted.");

      const nextGroup = groups.find(g => g.id !== group.id);
      if (nextGroup) {
        selectGroup(nextGroup);
      } else {
        selectGroup(null);
        localStorage.removeItem("activeGroupId");
      }
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to delete the batch.");
      console.error(error);
    } finally {
      setModalType(null);
    }
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fadeIn transition-colors duration-300">

      {/* Header Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-white/5 overflow-hidden mb-8 transition-colors duration-300">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-slate-800 dark:to-indigo-950 px-8 py-10 text-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-sm">
                <Users className="w-7 h-7 text-indigo-300" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{group.groupName}</h1>
                <p className="text-indigo-200 mt-1">Batch Information & Details</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            {isOwner ? (
              <button
                onClick={() => setModalType('delete')}
                className="px-5 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors border border-rose-500/50 flex items-center gap-2 shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete Batch
              </button>
            ) : (
              <button
                onClick={() => setModalType('leave')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors border border-slate-600/50 flex items-center gap-2 shadow-sm"
              >
                <LogOut className="w-4 h-4" /> Leave Batch
              </button>
            )}
          </div>
        </div>

        <div className="p-8">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            Invite Code
          </h3>
          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80 font-medium mb-1">Share this code with your batchmates</p>
              <span className="text-3xl font-mono font-bold text-indigo-900 dark:text-indigo-300 tracking-widest">{group.groupCode}</span>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl transition-all shadow-sm"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Code
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Members Section Note */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-white/5 p-8 transition-colors duration-300">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
          <Users className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
          Batch Members Target
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {group.members && group.members.length > 0 ? (
            group.members.map((member, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                  {member.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={member}>
                    {member}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Member</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 font-medium">No members found</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={modalType === 'delete'}
        onClose={() => setModalType(null)}
        onConfirm={handleDeleteBatch}
        title="Delete Batch Permanently?"
        description={`This action cannot be undone. All progress records associated with ${group.groupName} will be orphaned.`}
        confirmText="delete"
        actionButtonText="Delete Batch"
        actionButtonColor="bg-rose-600 hover:bg-rose-700"
      />

      <ConfirmModal
        isOpen={modalType === 'leave'}
        onClose={() => setModalType(null)}
        onConfirm={handleLeaveBatch}
        title="Leave Batch?"
        description={`Are you sure you want to leave ${group.groupName}? You will lose access to its leaderboard and tracking.`}
        confirmText="leave"
        actionButtonText="Leave Batch"
        actionButtonColor="bg-rose-600 hover:bg-rose-700"
      />

    </div >
  );
}

export default GroupInfo;
