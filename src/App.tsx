import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Login } from '@/pages/Auth/Login';
import { Register } from '@/pages/Auth/Register';
import { ForgotPassword } from '@/pages/Auth/ForgotPassword';
import { Dashboard } from '@/pages/Dashboard/Dashboard';
import { Settings } from '@/pages/Settings/Settings';
import { Profile } from '@/pages/Profile/Profile';
import { FoodCalendar } from '@/pages/Calendar/FoodCalendar';
import { MemoPage } from '@/pages/Memo/MemoPage';
import { AdminDashboard } from '@/pages/Admin/AdminDashboard';
import { PrivateRoute } from '@/components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<FoodCalendar />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/memo" element={<MemoPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
