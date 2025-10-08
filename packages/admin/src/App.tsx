import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Users from './pages/Users';
import Actors from './pages/Actors';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/actors"
          element={
            <ProtectedRoute>
              <Actors />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/users" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
