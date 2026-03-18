import { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, updateDoc, collection, getDocs, setDoc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

export const useEnglishKicks = (groupId) => {
    const [kicks, setKicks] = useState([]);
    const [allUsers, setAllUsers] = useState({});
    const [coordinator, setCoordinator] = useState(null);
    const [rules, setRules] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!groupId) return;

        let unsubPoints = () => { };

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // 1. Fetch group
                const groupRef = doc(db, "groups", groupId);
                const groupSnap = await getDoc(groupRef);
                const groupData = groupSnap.data() || {};

                setCoordinator(groupData.englishKickCoordinator || null);
                setRules(groupData.englishKickRules || "No rules defined yet.");

                const groupMembers = groupData.members || [];

                // 2. Fetch all users
                const usersSnap = await getDocs(collection(db, "users"));
                const usersMap = {};
                usersSnap.docs.forEach(d => {
                    const uData = d.data();
                    usersMap[d.id] = {
                        name: uData.nickName || uData.fullName || uData.displayName || uData.email || "Unknown",
                        emoji: uData.emoji || "",
                        email: uData.email,
                        photoURL: uData.photoURL || null
                    };
                });
                setAllUsers(usersMap);

                // 3. Listen to points in real-time
                unsubPoints = onSnapshot(
                    collection(db, "groups", groupId, "englishKick"),
                    (snapshot) => {
                        const pointsMap = {};
                        snapshot.docs.forEach(d => {
                            pointsMap[d.id] = d.data().points || 0;
                        });

                        const mergedMembers = groupMembers
                            .filter(memberId => usersMap[memberId] && usersMap[memberId].name !== "Unknown")
                            .map(memberId => {
                                const userInfo = usersMap[memberId] || {};
                                return {
                                    id: memberId, // For EnglishKick
                                    userId: memberId, // For KicksBoard backward compatibility
                                    userName: userInfo.name || "Unknown",
                                    name: userInfo.name || "Unknown",
                                    emoji: userInfo.emoji || "",
                                    photoURL: userInfo.photoURL || null,
                                    points: pointsMap[memberId] || 0
                                };
                            });

                        // Sort alphabetically
                        mergedMembers.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                        setKicks(mergedMembers);
                    }
                );
            } catch (error) {
                console.error("Error fetching English Kick data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        return () => {
            unsubPoints();
        };
    }, [groupId]);

    const handleAddPoint = async (userId, currentPoints) => {
        try {
            const newPoints = currentPoints + 1;
            await setDoc(doc(db, "groups", groupId, "englishKick", userId), { points: newPoints }, { merge: true });
            toast.success("+1 Point Added!");
        } catch (error) {
            toast.error("Failed to add point.");
        }
    };

    const handleMinusPoint = async (userId, currentPoints) => {
        try {
            const newPoints = Math.max(0, currentPoints - 1);
            if (currentPoints === 0) return;
            await setDoc(doc(db, "groups", groupId, "englishKick", userId), { points: newPoints }, { merge: true });
            toast.success("-1 Point Deducted!");
        } catch (error) {
            toast.error("Failed to deduct point.");
        }
    };

    const handleAssignCoordinator = async (userId) => {
        try {
            await updateDoc(doc(db, "groups", groupId), {
                englishKickCoordinator: userId
            });
            setCoordinator(userId);
            toast.success("Coordinator assigned successfully.");
        } catch (error) {
            toast.error("Failed to assign coordinator.");
        }
    };

    const handleSaveRules = async (newRules) => {
        try {
            await updateDoc(doc(db, "groups", groupId), {
                englishKickRules: newRules
            });
            setRules(newRules);
            toast.success("Rules updated.");
        } catch (error) {
            toast.error("Failed to update rules.");
        }
    };

    const handleResetAllPoints = async () => {
        try {
            const updates = kicks.map(m =>
                setDoc(doc(db, "groups", groupId, "englishKick", m.id), { points: 0 }, { merge: true })
            );
            await Promise.all(updates);
            toast.success("All points have been reset to zero.");
        } catch (error) {
            toast.error("Failed to reset points.");
        }
    };

    return {
        kicks,
        allUsers,
        coordinator,
        rules,
        loading,
        handleAddPoint,
        handleMinusPoint,
        handleAssignCoordinator,
        handleSaveRules,
        handleResetAllPoints
    };
};
