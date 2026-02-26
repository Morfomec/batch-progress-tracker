/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeProfile = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data());
                    } else {
                        setUserProfile(null);
                    }
                    setLoading(false);
                });
            } else {
                setUserProfile(null);
                if (unsubscribeProfile) unsubscribeProfile();
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    const isAdmin = userProfile?.role === "admin" || user?.email === "muhammedshifil@gmail.com";

    return (
        <AuthContext.Provider value={{ user, userProfile, isAdmin, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}