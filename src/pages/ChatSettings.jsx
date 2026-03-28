import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { ArrowLeft, LogOut, Trash2, Camera, Check, Settings, User, Search, Bell, BellOff, Loader2, Hash, X, ExternalLink, Edit2, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { updateGroupName, deleteGroupChat, updateGroupIcon } from "../firebase/chatService";

export default function ChatSettings() {
  const { roomId: roomIdParam } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [peerProfile, setPeerProfile] = useState(null);
  
  // Custom Modals State
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [membersList, setMembersList] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null });

  // Admin Edit State
  const [editNameValue, setEditNameValue] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  
  // Icon Upload State
  const fileInputRef = useRef(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // Derive mute status from real-time userProfile
  const isMuted = !!userProfile?.mutedChats?.[roomIdParam];

  useEffect(() => {
    async function fetchRoom() {
      if (!roomIdParam) return;
      try {
        const docRef = doc(db, "chatRooms", roomIdParam);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setRoom(data);
          setEditNameValue(data.name || "");

          if (data.type === 'private') {
            const peerId = data.members?.find(id => id !== user.uid);
            if (peerId) {
              const peerDoc = await getDoc(doc(db, "users", peerId));
              if (peerDoc.exists()) {
                setPeerProfile(peerDoc.data());
              }
            }
          }
        } else {
          toast.error("Chat room not found.");
          navigate("/dashboard/chat");
        }
      } catch (err) {
        console.error("Error fetching room details", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
  }, [roomIdParam, navigate, user.uid]);

  const toggleMute = async () => {
      try {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
              [`mutedChats.${roomIdParam}`]: !isMuted
          });
          toast.success(!isMuted ? "Chat muted." : "Chat unmuted.");
      } catch (error) {
          console.error("Error toggling mute", error);
          toast.error("Failed to update mute settings.");
      }
  };

  const handleOpenMembersModal = async () => {
    setShowMembersModal(true);
    if (membersList.length > 0) return;
    
    setLoadingMembers(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      let users = [];
      snap.forEach(doc => {
        const d = doc.data();
        users.push({
          id: doc.id,
          name: d.fullName || d.nickName || d.displayName || d.email || "Unknown User",
          photo: d.photoURL || null
        });
      });

      users = users.filter(u => room.members?.includes(u.id));
      users.sort((a,b) => a.name.localeCompare(b.name));
      setMembersList(users);
    } catch (err) {
      console.error("Failed to fetch members", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmDialog.type === 'delete') {
      try {
        await deleteGroupChat(room.id);
        toast.success("Chat deleted successfully.");
        navigate("/dashboard/chat");
      } catch (error) {
        toast.error("Failed to delete chat.");
      }
    } else if (confirmDialog.type === 'exit') {
      try {
        const roomRef = doc(db, "chatRooms", room.id);
        const updatedMembers = room.members.filter(uid => uid !== user.uid);
        await updateDoc(roomRef, { members: updatedMembers });
        toast.success("Left the chat");
        navigate("/dashboard/chat");
      } catch (e) {
        console.error("Error exiting room", e);
        toast.error("Failed to leave chat");
      }
    }
    setConfirmDialog({ isOpen: false, type: null });
  };

  const handleExitClick = () => {
    if (room?.adminId === user.uid && room?.members?.length > 1 && room.type !== 'global') {
      toast.error("Admins cannot exit the group while other members are in it.");
      return;
    }
    setConfirmDialog({ isOpen: true, type: 'exit' });
  };

  const saveGroupName = async () => {
    if (!editNameValue.trim() || editNameValue.trim() === room.name) return;
    setIsUpdatingName(true);
    try {
      await updateGroupName(room.id, editNameValue.trim());
      setRoom({ ...room, name: editNameValue.trim() });
      setShowEditName(false);
      toast.success("Name updated");
    } catch (error) {
      toast.error("Failed to update name");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleIconChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file.");
        return;
    }
    setUploadingIcon(true);
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "react_firebase_project_upload");
        const res = await fetch("https://api.cloudinary.com/v1_1/defrohr5n/image/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error("Upload failed");
        await updateGroupIcon(room.id, data.secure_url);
        setRoom({ ...room, iconUrl: data.secure_url });
        toast.success("Icon updated!");
    } catch (error) {
        toast.error("Failed to upload icon.");
    } finally {
        setUploadingIcon(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex items-center gap-2 text-slate-500">
           <Settings className="w-5 h-5 animate-spin"/> Loading...
        </div>
      </div>
    );
  }

  if (!room) return null;

  const isAdmin = room.adminId === user.uid;
  const isGlobal = room.type === 'global';
  const isPrivate = room.type === 'private';
  const filteredMembers = membersList.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const displayRoomName = isPrivate && peerProfile 
    ? peerProfile.fullName || peerProfile.nickName || peerProfile.displayName || "Private Chat"
    : room.name || "Chat Room";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header - COMPACT STYLE */}
      <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/dashboard/chat")}
            className="p-2 rounded-full text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-baseline gap-1.5 flex-wrap">
             <h1 className="text-base font-bold text-slate-600 dark:text-slate-400">Settings:</h1>
             <span className="text-base font-black text-indigo-600 dark:text-indigo-300">
                {displayRoomName}
             </span>
             {!isGlobal && !isPrivate && (
                 <button 
                    onClick={() => setShowEditName(!showEditName)}
                    className="ml-1 p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                 </button>
             )}
          </div>
        </div>

        {!isGlobal && (
            <button
                onClick={handleExitClick}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors"
                title={isPrivate ? "Delete Conversation" : "Exit Group"}
            >
                <LogOut className="w-5 h-5" />
            </button>
        )}
      </div>

      {/* Quick Edit Name Reveal (Compact) */}
      {showEditName && (
           <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 p-3 rounded-xl flex gap-2 animate-slideDown">
                <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="New chat name..."
                />
                <button
                    onClick={saveGroupName}
                    disabled={isUpdatingName || !editNameValue.trim()}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                    {isUpdatingName ? "Saving..." : "Update"}
                </button>
                <button 
                onClick={() => setShowEditName(false)}
                className="p-1.5 text-slate-500 hover:text-slate-700">
                    <X className="w-4 h-4" />
                </button>
           </div>
      )}

      <div className="grid grid-cols-1 gap-4">
          {/* Notifications Toggle (Compact Card) */}
          <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${isMuted ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'} dark:bg-indigo-900/20`}>
                     {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                 </div>
                 <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Notifications</h2>
                    <p className="text-[11px] text-slate-500">{isMuted ? "Muted" : "Active"}</p>
                 </div>
             </div>
             
             <button 
                 onClick={toggleMute}
                 className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${isMuted ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
             >
                 <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isMuted ? 'translate-x-5' : 'translate-x-1'}`} />
             </button>
          </div>

          {/* Members Card (Groups Only) - Compact */}
          {!isPrivate && (
              <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/20">
                        <User className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Members</h2>
                        <p className="text-[11px] text-slate-500">{room.members?.length || 0} participants</p>
                    </div>
                </div>
                
                <button
                    onClick={handleOpenMembersModal}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg transition-colors"
                >
                    View All
                </button>
              </div>
          )}

          {/* Group Icon (Only for Groups, visible to all) */}
          {!isPrivate && !isGlobal && (
          <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20">
                     <Camera className="w-4 h-4" />
                 </div>
                 <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Chat Icon</h2>
                    <p className="text-[11px] text-slate-500">Update group image</p>
                 </div>
             </div>
             
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden shadow-inner flex items-center justify-center">
                    {room.iconUrl ? <img src={room.iconUrl} alt="" className="w-full h-full object-cover" /> : <Hash className="w-3.5 h-3.5 text-slate-400" />}
                </div>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleIconChange} />
                <button
                    onClick={() => !uploadingIcon && fileInputRef.current?.click()}
                    disabled={uploadingIcon}
                    className="p-1.5 text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                    {uploadingIcon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-3.5 h-3.5" />}
                </button>
             </div>
          </div>
          )}

          {/* Delete Action (Admins only for Groups, anyone for Private) */}
          {(isAdmin || isPrivate) && !isGlobal && (
              <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl p-4 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Danger Zone</p>
                  </div>
                  <button
                    onClick={() => setConfirmDialog({ isOpen: true, type: 'delete' })}
                    className="px-3 py-1.5 text-rose-600 hover:text-rose-700 text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    {isPrivate ? "Delete Chat" : "Delete Group"}
                  </button>
              </div>
          )}
      </div>

      {/* Members Modal (Keep as is but slightly more compact) */}
      {!isPrivate && showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Room Participants</h3>
              <button onClick={() => setShowMembersModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search members..." 
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 text-xs rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                    {loadingMembers ? (
                      <div className="text-center text-xs py-8"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2"/> Loading...</div>
                    ) : (
                      filteredMembers.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                              {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" /> : m.name.charAt(0)}
                            </div>
                            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate">{m.name}</span>
                          </div>
                          <button onClick={() => navigate(`/dashboard/profile/${m.id}`)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col p-6 text-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              {confirmDialog.type === 'delete' ? "Delete Chat?" : "Exit Group?"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDialog({ isOpen: false, type: null })} className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1">
                Cancel
              </button>
              <button onClick={handleConfirmAction} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md transition-colors flex-1">
                {confirmDialog.type === 'delete' ? "Delete" : "Exit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
