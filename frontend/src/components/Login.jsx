import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e?.preventDefault();
    const success = await login(email, password);
    if (!success) {
      setError('Email ou mot de passe incorrect.');
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div id="login-screen" style={{ display: 'flex' }}>
      <div className="login-card">
        <div className="login-logo">Pro<span>Flow</span></div>
        <div className="login-sub">Plateforme de gestion de projets collaboratifs (MERN)</div>

        <form onSubmit={handleLogin}>
          <label className="field-label">Adresse email</label>
          <input className="field-input" type="email" placeholder="email@example.com" 
                 value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label className="field-label">Mot de passe</label>
          <input className="field-input" type="password" placeholder="••••••••" 
                 value={password} onChange={(e) => setPassword(e.target.value)} required />

          <button type="submit" className="btn-primary btn-chef">Se connecter</button>
          {error && <div className="login-error" style={{ display: 'block' }}>{error}</div>}
        </form>

        <div className="demo-accounts">
          <div className="demo-label">Comptes de démonstration</div>
          <div className="demo-grid">
            <button className="demo-btn" onClick={() => fillDemo('client@proflow.com','client123')}>
              <span className="demo-dot" style={{ background: 'var(--accent-client)' }}></span>Client
            </button>
            <button className="demo-btn" onClick={() => fillDemo('chef@proflow.com','chef123')}>
              <span className="demo-dot" style={{ background: 'var(--accent-chef)' }}></span>Chef de Projet
            </button>
            <button className="demo-btn" onClick={() => fillDemo('designer@proflow.com','designer123')}>
              <span className="demo-dot" style={{ background: 'var(--accent-designer)' }}></span>Designer
            </button>
            <button className="demo-btn" onClick={() => fillDemo('dev@proflow.com','dev123')}>
              <span className="demo-dot" style={{ background: 'var(--accent-dev)' }}></span>Développeur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
