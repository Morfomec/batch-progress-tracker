import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, setDoc, limit } from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * Get the poke relationship between two users
 * Returns: { status: 'none' | 'sent' | 'received' | 'accepted', chatId?: string, pokeId?: string, createdAt?: any }
 */
export const getPokeStatus = async (currentUserId, targetUserId) => {
  if (!currentUserId || !targetUserId) return { status: 'none' };

  try {
    // 1. Check if they already have a private chat
    const chatsQuery = query(
      collection(db, "chatRooms"),
      where("type", "==", "private"),
      where("members", "array-contains", currentUserId),
      limit(20) // Safety limit
    );
    const chatsSnap = await getDocs(chatsQuery);
    
    const existingChat = chatsSnap.docs.find(doc => {
      const data = doc.data();
      return data.members?.includes(targetUserId);
    });

    if (existingChat) {
      return { status: 'accepted', chatId: existingChat.id };
    }

    // 2. Check for existing pending pokes
    const pokesQuery = query(
      collection(db, "pokes"),
      where("participants", "array-contains", currentUserId),
      where("status", "==", "pending"),
      limit(5)
    );
    const pokesSnap = await getDocs(pokesQuery);
    
    const existingPoke = pokesSnap.docs.find(doc => {
      const data = doc.data();
      return data.participants?.includes(targetUserId);
    });

    if (existingPoke) {
      const data = existingPoke.data();
      if (data.fromUserId === currentUserId) {
        return { status: 'sent', pokeId: existingPoke.id, createdAt: data.createdAt };
      } else {
        return { status: 'received', pokeId: existingPoke.id, createdAt: data.createdAt };
      }
    }

    return { status: 'none' };
  } catch (error) {
    console.error("Error getting poke status", error);
    return { status: 'none' };
  }
};

/**
 * Send a poke to another user
 */
export const sendPoke = async (currentUserId, targetUserId, currentUserName) => {
  if (!currentUserId || !targetUserId) return;
  
  // Check if a pending poke already exists from us to them
  const pokesQuery = query(
    collection(db, "pokes"),
    where("fromUserId", "==", currentUserId),
    where("toUserId", "==", targetUserId),
    where("status", "==", "pending")
  );
  const pokesSnap = await getDocs(pokesQuery);

  if (!pokesSnap.empty) {
    // Update the existing poke's timestamp (Nudge)
    const pokeDoc = pokesSnap.docs[0];
    await updateDoc(doc(db, "pokes", pokeDoc.id), {
        createdAt: serverTimestamp()
    });
  } else {
    // Create new poke
    await addDoc(collection(db, "pokes"), {
      participants: [currentUserId, targetUserId],
      fromUserId: currentUserId,
      toUserId: targetUserId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  }

  // Add persistent notification for the target user
  const notifRef = collection(db, "users", targetUserId, "notifications");
  await addDoc(notifRef, {
    title: "New Poke!",
    message: `${currentUserName || "Someone"} poked you.`,
    type: "alert",
    unread: true,
    createdAt: serverTimestamp(),
    link: "/dashboard/chat"
  });
};

/**
 * Accept a poke (Poke back) and create a private chat
 */
export const acceptPoke = async (pokeId, currentUserId, targetUserId, currentUserName, targetUserName) => {
  if (!pokeId) return;

  // 1. Mark poke as accepted
  const pokeRef = doc(db, "pokes", pokeId);
  await updateDoc(pokeRef, {
    status: 'accepted',
    updatedAt: serverTimestamp()
  });

  // 2. Create actual private chat room
  const chatRef = await addDoc(collection(db, "chatRooms"), {
    name: "Private Chat", 
    type: "private",
    members: [currentUserId, targetUserId],
    adminId: "system", 
    createdAt: serverTimestamp(),
  });

  // 3. Add persistent notification for the target user (the one who originally poked)
  const notifRef = collection(db, "users", targetUserId, "notifications");
  await addDoc(notifRef, {
    title: "Poke Accepted!",
    message: `${currentUserName} poked you back. You can now chat!`,
    type: "success",
    unread: true,
    createdAt: serverTimestamp(),
    link: "/dashboard/chat"
  });

  return chatRef.id;
};
