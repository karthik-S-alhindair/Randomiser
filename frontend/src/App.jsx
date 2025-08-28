import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Mainlogin from "./pages/Mainlogin";
import { UserProvider } from "./context/UserContext";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import UserUploadStaffData from "./pages/UserUploadStaffData";
import AdminUploadStaffData from "./pages/AdminUploadStaffData";
import AdminUsers from "./pages/AdminUsers";
import AdminDept from "./pages/AdminDept";
import AdminShifts from "./pages/AdminShifts";
import AdminStation from "./pages/AdminStation";
import UserReports from "./pages/UserReports";
import AdminReports from "./pages/AdminReports";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Mainlogin />} />
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          <Route
            path="/user/upload-staff-data"
            element={<UserUploadStaffData />}
          />
          <Route
            path="/admin/upload-staff-data"
            element={<AdminUploadStaffData />}
          />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/departments" element={<AdminDept />} />
          <Route path="/admin/shifts" element={<AdminShifts />} />
          <Route path="/admin/station" element={<AdminStation />} />
          <Route path="/user/reports" element={<UserReports />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allow={["superadmin"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allow={["admin", "superadmin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user"
            element={
              <ProtectedRoute allow={["user", "admin", "superadmin"]}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
