import { collection, doc, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc, deleteDoc, where, or } from "firebase/firestore";
import { db } from "./firebaseConfig";

// -------------------------------------------------------------
// CHAT ROOMS
// -------------------------------------------------------------

/**
 * Ensures the "Global" chat exists.
 */
export const initializeGlobalChat = async () => {
  const globalRef = doc(db, "chatRooms", "global");
  const globalSnap = await getDoc(globalRef);
  if (!globalSnap.exists()) {
    await setDoc(globalRef, {
      name: "Global Chat",
      type: "global",
      members: [], // Global doesn't strictly need members array since everyone sees it
      createdAt: serverTimestamp(),
    });
  }
};

/**
 * Creates a new Group Chat
 */
export const createGroupChat = async (name, creatorId) => {
  const chatRoomsRef = collection(db, "chatRooms");
  await addDoc(chatRoomsRef, {
    name,
    type: "group",
    members: [creatorId], // Creator joins automatically
    adminId: creatorId,   // Assign admin role to creator
    createdAt: serverTimestamp(),
  });
};

/**
 * Joins a Group Chat
 */
export const joinGroupChat = async (roomId, userId) => {
  const roomRef = doc(db, "chatRooms", roomId);
  await updateDoc(roomRef, {
    members: arrayUnion(userId)
  });
};

/**
 * Leaves a Group Chat
 */
export const leaveGroupChat = async (roomId, userId) => {
  const roomRef = doc(db, "chatRooms", roomId);
  await updateDoc(roomRef, {
    members: arrayRemove(userId)
  });
};

/**
 * Subscribe to allowed chat rooms (Global, Groups, and User's Private chats)
 */
export const subscribeToChatRooms = (userId, callback) => {
  if (!userId) return () => {};
  
  const chatRoomsRef = collection(db, "chatRooms");
  
  // Query for rooms that are:
  // 1. Global (everyone sees)
  // 2. Group (everyone sees for discovery)
  // 3. Private AND the user is a member
  const q = query(
    chatRoomsRef, 
    or(
      where("type", "==", "global"),
      where("type", "==", "group"),
      where("members", "array-contains", userId)
    ),
    orderBy("createdAt", "asc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(rooms);
  });
};

// -------------------------------------------------------------
// MESSAGES
// -------------------------------------------------------------

/**
 * Send a message to a specific room and notify members
 */
export const sendMessage = async (roomId, senderId, senderName, senderPhoto, text) => {
  if (!text.trim()) return;
  
  // 1. Add Message to room
  const messagesRef = collection(db, "chatRooms", roomId, "messages");
  await addDoc(messagesRef, {
    text,
    senderId,
    senderName,
    senderPhoto: senderPhoto || null,
    timestamp: serverTimestamp(),
  });

  // 2. Handle Notifications (Skip for global to avoid spam)
  if (roomId === 'global') return;

  try {
    const roomRef = doc(db, "chatRooms", roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data();
    const members = roomData.members || [];
    const roomName = roomData.name || "Chat Room";

    // For each member except sender
    for (const memberId of members) {
      if (memberId === senderId) continue;

      // Fetch member profile to check mute
      const memberRef = doc(db, "users", memberId);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        const memberData = memberSnap.data();
        const isMuted = !!memberData.mutedChats?.[roomId];
        
        if (!isMuted) {
          const notifRef = collection(db, "users", memberId, "notifications");
          await addDoc(notifRef, {
            title: `Message: ${senderName}`,
            message: text.length > 50 ? text.substring(0, 47) + "..." : text,
            type: "chat",
            unread: true,
            createdAt: serverTimestamp(),
            link: `/dashboard/chat?room=${roomId}`,
            roomId: roomId
          });
        }
      }
    }
  } catch (error) {
    console.error("Error sending notifications for message:", error);
  }
};

/**
 * Subscribe to messages for a specific room
 */
export const subscribeToMessages = (roomId, callback) => {
  if (!roomId) return () => {};
  const messagesRef = collection(db, "chatRooms", roomId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
};

/**
 * Update a Group Chat Name
 */
export const updateGroupName = async (roomId, newName) => {
  if (!roomId || !newName.trim()) return;
  const roomRef = doc(db, "chatRooms", roomId);
  await updateDoc(roomRef, {
    name: newName.trim()
  });
};

/**
 * Update a Group Chat Icon
 */
export const updateGroupIcon = async (roomId, newIconUrl) => {
  if (!roomId || !newIconUrl) return;
  const roomRef = doc(db, "chatRooms", roomId);
  await updateDoc(roomRef, {
    iconUrl: newIconUrl
  });
};

/**
 * Delete a Group Chat
 */
export const deleteGroupChat = async (roomId) => {
  if (!roomId) return;
  const roomRef = doc(db, "chatRooms", roomId);
  await deleteDoc(roomRef);
};

/**
 * Kicks a user from a group chat
 */
export const kickUserFromRoom = async (roomId, targetUserId) => {
    if (!roomId || !targetUserId) return;
    const roomRef = doc(db, "chatRooms", roomId);
    await updateDoc(roomRef, {
        members: arrayRemove(targetUserId)
    });
};

/**
 * Bans a user from a room (prevents re-entry)
 */
export const banUserFromRoom = async (roomId, targetUserId) => {
    if (!roomId || !targetUserId) return;
    const roomRef = doc(db, "chatRooms", roomId);
    await updateDoc(roomRef, {
        bannedUsers: arrayUnion(targetUserId),
        members: arrayRemove(targetUserId) // Also kick them if they were a member
    });
};
