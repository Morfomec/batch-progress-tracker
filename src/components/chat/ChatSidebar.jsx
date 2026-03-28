import { Users, Hash, LogOut, MessageSquarePlus, Globe, Bell, BellOff, User } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import toast from "react-hot-toast";

export default function ChatSidebar({ 
  rooms, 
  activeRoomId, 
  onSelectRoom, 
  onJoinRoom, 
  userId, 
  userProfile,
  peerProfiles = {},
  onCreateRoom 
}) {
  
  const handleToggleMute = async (e, roomId) => {
    e.stopPropagation();
    if (!userId) return;

    try {
      const isMuted = userProfile?.mutedChats?.[roomId];
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        [`mutedChats.${roomId}`]: !isMuted
      });
      toast.success(!isMuted ? "Notifications muted for this chat" : "Notifications unmuted for this chat");
    } catch (error) {
      console.error("Error toggling mute:", error);
      toast.error("Failed to update mute settings");
    }
  };

  const getRoomName = (room) => {
    if (room.type === 'private') {
      const peerId = room.members?.find(id => id !== userId);
      const peer = peerProfiles[peerId];
      if (peer) return peer.fullName || peer.nickName || peer.displayName || "Private Chat";
      return "Private Chat";
    }
    return room.name || "Chat Room";
  };

  const getRoomIcon = (room) => {
    if (room.type === 'private') {
        const peerId = room.members?.find(id => id !== userId);
        const peer = peerProfiles[peerId];
        if (peer?.photoURL) {
            return <img src={peer.photoURL} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />;
        }
        return <User className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />;
    }
    if (room.iconUrl) {
        return <img src={room.iconUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />;
    }
    return <Hash className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />;
  };

  // Separate into global, joined, and discover
  const globalRoom = rooms.find(r => r.type === 'global');
  const joinedRooms = rooms.filter(r => (r.type === 'group' || r.type === 'private') && r.members?.includes(userId));
  const discoverRooms = rooms.filter(r => r.type === 'group' && !r.members?.includes(userId));

  return (
    <div className="w-full flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0a]">
      {/* Header - Fixed Height for alignment */}
      <div className="h-[60px] px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#0a0a0a]">
        <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Chats
        </h2>
        <button 
          onClick={onCreateRoom}
          className="p-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-md transition-colors"
          title="Create Group"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Global Chat */}
        <div>
          <div className="px-2 mb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Public
          </div>
          {globalRoom && (
              <div
                className={`w-full group/item flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activeRoomId === globalRoom.id
                    ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200"
                    : "text-slate-700 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
                }`}
                onClick={() => onSelectRoom(globalRoom)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="w-4 h-4 text-[#408A71] shrink-0" />
                  <span className="truncate">{globalRoom.name || "Global Chat"}</span>
                </div>
                
                <button
                  onClick={(e) => handleToggleMute(e, globalRoom.id)}
                  className={`p-1 rounded-md opacity-0 group-hover/item:opacity-100 transition-all hover:bg-white dark:hover:bg-slate-700 ${
                    userProfile?.mutedChats?.[globalRoom.id] ? "text-amber-500 opacity-100" : "text-slate-400"
                  }`}
                  title={userProfile?.mutedChats?.[globalRoom.id] ? "Unmute" : "Mute"}
                >
                  {userProfile?.mutedChats?.[globalRoom.id] ? (
                    <BellOff className="w-3.5 h-3.5" />
                  ) : (
                    <Bell className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
          )}
        </div>

        {/* Joined Chats */}
        {joinedRooms.length > 0 && (
          <div>
            <div className="px-2 mb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Your Chats
            </div>
            {joinedRooms.map(room => (
              <div
                key={room.id}
                className={`w-full group/item flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 cursor-pointer ${
                  activeRoomId === room.id
                    ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200"
                    : "text-slate-700 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
                }`}
                onClick={() => onSelectRoom(room)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getRoomIcon(room)}
                  <span className="truncate">{getRoomName(room)}</span>
                </div>
                
                <button
                  onClick={(e) => handleToggleMute(e, room.id)}
                  className={`p-1 rounded-md opacity-0 group-hover/item:opacity-100 transition-all hover:bg-white dark:hover:bg-slate-700 ${
                    userProfile?.mutedChats?.[room.id] ? "text-amber-500 opacity-100" : "text-slate-400"
                  }`}
                  title={userProfile?.mutedChats?.[room.id] ? "Unmute" : "Mute"}
                >
                  {userProfile?.mutedChats?.[room.id] ? (
                    <BellOff className="w-3.5 h-3.5" />
                  ) : (
                    <Bell className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Discover Groups */}
        {discoverRooms.length > 0 && (
          <div>
            <div className="px-2 mb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Discover & Join
            </div>
            {discoverRooms.map(room => (
              <div
                key={room.id}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-[#949ba4] hover:bg-slate-200/50 dark:hover:bg-[#35373c] transition-colors mb-0.5 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {room.iconUrl ? (
                     <img src={room.iconUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 grayscale hover:grayscale-0 transition-all" />
                  ) : (
                     <Hash className="w-4 h-4 shrink-0" />
                  )}
                  <span className="truncate">{room.name}</span>
                </div>
                <button
                  onClick={() => onJoinRoom(room.id)}
                  className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 dark:bg-[#248046] dark:hover:bg-[#1a6334] text-emerald-700 dark:text-white rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
