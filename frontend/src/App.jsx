import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import WireframeGenerator from './components/WireframeGenerator';
import N8nAutomation from './components/N8nAutomation';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/wireframe-generator" element={user ? <WireframeGenerator /> : <Navigate to="/login" />} />
      <Route path="/n8n-automation" element={user ? <N8nAutomation /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
