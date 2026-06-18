import { collection, getDocs, writeBatch, doc, serverTimestamp, addDoc, query, where } from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * Broadcasts a custom notification to every user in the database.
 * Uses batch writes to handle potentially large numbers of users efficiently.
 */
export const broadcastAnnouncement = async (title, message, link, sender, mentions = []) => {
    try {
        let globalMsgId = null;

        // Post to global chat room FIRST
        if (sender && message) {
            const globalMsgRef = collection(db, "chatRooms", "global", "messages");
            const docRef = await addDoc(globalMsgRef, {
                text: title ? `📢 **${title}**\n\n${message}` : `📢 ${message}`,
                senderId: sender.uid,
                senderName: sender.displayName || "Admin",
                senderPhoto: sender.photoURL || null,
                timestamp: serverTimestamp(),
                mentions: mentions
            });
            globalMsgId = docRef.id;
        }

        const usersSnap = await getDocs(collection(db, "users"));
        
        let batch = writeBatch(db);
        let count = 0;
        let totalSent = 0;

        for (const userDoc of usersSnap.docs) {
            const notifRef = doc(collection(db, "users", userDoc.id, "notifications"));
            const notifData = {
                title: title.trim() || "Announcement",
                message: message.trim(),
                type: "announcement",
                unread: true,
                createdAt: serverTimestamp(),
                link: link?.trim() || null,
                mentions: mentions
            };
            
            if (globalMsgId) {
                notifData.globalMsgId = globalMsgId;
            }

            batch.set(notifRef, notifData);
            
            count++;
            totalSent++;

            // Firestore batches have a 500 operation limit. 
            // We commit at 490 to be safe.
            if (count === 490) {
                await batch.commit();
                batch = writeBatch(db);
                count = 0;
            }
        }

        // Commit any remaining operations in the last batch
        if (count > 0) {
            await batch.commit();
        }

        return totalSent;
    } catch (error) {
        console.error("Error broadcasting announcement:", error);
        throw error;
    }
};

/**
 * Synchronizes edits made in the Global Chat room back to all users' individual notifications.
 */
export const syncAnnouncementEdit = async (globalMsgId, newText) => {
    if (!globalMsgId || !newText) return;
    try {
        const usersSnap = await getDocs(collection(db, "users"));
        let batch = writeBatch(db);
        let count = 0;

        // Clean the text: Remove the '📢 **Title**\n\n' or '📢 ' prefix for the notification
        let notifText = newText;
        const prefixMatch = newText.match(/^📢\s+(\*\*[^*]+\*\*\n\n)?/);
        if (prefixMatch) {
             notifText = newText.substring(prefixMatch[0].length).trim();
        }

        for (const userDoc of usersSnap.docs) {
            const notifQuery = query(
                collection(db, "users", userDoc.id, "notifications"), 
                where("globalMsgId", "==", globalMsgId)
            );
            const notifSnap = await getDocs(notifQuery);
            
            notifSnap.forEach(docSnap => {
                batch.update(docSnap.ref, { message: notifText });
                count++;
            });

            if (count >= 400) {
                await batch.commit();
                batch = writeBatch(db);
                count = 0;
            }
        }

        if (count > 0) {
            await batch.commit();
        }
    } catch (error) {
        console.error("Error syncing announcement edit:", error);
    }
};

/**
 * Synchronizes deletes made in the Global Chat room back to all users' individual notifications.
 */
export const syncAnnouncementDelete = async (globalMsgId) => {
    if (!globalMsgId) return;
    try {
        const usersSnap = await getDocs(collection(db, "users"));
        let batch = writeBatch(db);
        let count = 0;

        for (const userDoc of usersSnap.docs) {
            const notifQuery = query(
                collection(db, "users", userDoc.id, "notifications"), 
                where("globalMsgId", "==", globalMsgId)
            );
            const notifSnap = await getDocs(notifQuery);
            
            notifSnap.forEach(docSnap => {
                batch.delete(docSnap.ref);
                count++;
            });

            if (count >= 400) {
                await batch.commit();
                batch = writeBatch(db);
                count = 0;
            }
        }

        if (count > 0) {
            await batch.commit();
        }
    } catch (error) {
        console.error("Error syncing announcement delete:", error);
    }
};
