import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyProgress from "./pages/MyProgress";
import GroupInfo from "./pages/GroupInfo";
import CreateGroup from "./pages/CreateGroup";
import JoinGroup from "./pages/JoinGroup";
import ProfileSetup from "./pages/ProfileSetup";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import PeerProfile from "./pages/PeerProfile";
import MyProfile from "./pages/MyProfile";
import Peers from "./pages/Peers";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import GroupLayout from "./components/GroupLayout";
import AppLayout from "./layouts/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminGroupDetails from "./pages/AdminGroupDetails";
import { Toaster } from "react-hot-toast";

function App() {

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
          },
        }}
      />
      <Routes>


        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />

        <Route element={<ProtectedRoute><GroupLayout /></ProtectedRoute>}>
          <Route element={<AppLayout />}>

            <Route path="/dashboard">
              <Route index element={<Dashboard />} />
              <Route path="group-info" element={<GroupInfo />} />
              <Route path="my-progress" element={<MyProgress />} />
              <Route path="peers" element={<Peers />} />
              {/* SETTINGS (Non-group specific) */}
              <Route path="settings" element={<Settings />} />
              <Route path="my-profile" element={<MyProfile />} />
              {/* Peer Profile */}
              <Route path="profile/:userId" element={<PeerProfile />} />
            </Route>

            {/* STANDALONE PROTECTED PAGES */}
            <Route
              path="/create-group"
              element={<CreateGroup />}
            />
            <Route
              path="/join-group"
              element={<JoinGroup />}
            />

          </Route>
        </Route>

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="groups/:groupId" element={<AdminGroupDetails />} />
        </Route>

      </Routes>
    </>
  );
}

export default App;