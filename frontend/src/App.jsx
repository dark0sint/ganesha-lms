import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import KelasList from './pages/KelasList';
import KelasDetail from './pages/KelasDetail';
import KuisBuat from './pages/KuisBuat';
import KuisDetail from './pages/KuisDetail';
import Forum from './pages/Forum';
import Kelompok from './pages/Kelompok';
import Tracking from './pages/Tracking';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/kelas" element={<PrivateRoute><KelasList /></PrivateRoute>} />
      <Route path="/kelas/:id" element={<PrivateRoute><KelasDetail /></PrivateRoute>} />
      <Route path="/kelas/:kelasId/kuis/baru" element={<PrivateRoute><KuisBuat /></PrivateRoute>} />
      <Route path="/kuis/:id" element={<PrivateRoute><KuisDetail /></PrivateRoute>} />
      <Route path="/forum" element={<PrivateRoute><Forum /></PrivateRoute>} />
      <Route path="/kelompok" element={<PrivateRoute><Kelompok /></PrivateRoute>} />
      <Route path="/tracking" element={<PrivateRoute><Tracking /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
