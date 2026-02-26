import { Outlet } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function GroupLayout() {

  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);

  const selectGroup = (group) => {
    setActiveGroup(group);
    localStorage.setItem("activeGroupId", group.id);
  };

  useEffect(() => {
    if (!user) return;

    const fetchGroups = async () => {

      const q1 = query(
        collection(db, "groups"),
        where("members", "array-contains", user.uid)
      );

      const q2 = query(
        collection(db, "groups"),
        where("ownerId", "==", user.uid)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const groupMap = {};
      snap1.docs.forEach(doc => {
        groupMap[doc.id] = { id: doc.id, ...doc.data() };
      });
      snap2.docs.forEach(doc => {
        groupMap[doc.id] = { id: doc.id, ...doc.data() };
      });

      const groupList = Object.values(groupMap);

      setGroups(groupList);

      const savedGroupId = localStorage.getItem("activeGroupId");

      if (savedGroupId) {
        const found = groupList.find(g => g.id === savedGroupId);
        if (found) {
          setActiveGroup(found);
        } else if (groupList.length > 0) {
          setActiveGroup(groupList[0]);
          localStorage.setItem("activeGroupId", groupList[0].id);
        }
      } else if (groupList.length > 0) {
        setActiveGroup(groupList[0]);
        localStorage.setItem("activeGroupId", groupList[0].id);
      }
    };

    fetchGroups();
  }, [user]);

  return (
    <Outlet
      context={{
        group: activeGroup,
        groups,
        selectGroup
      }}
    />
  );
}

export default GroupLayout; 