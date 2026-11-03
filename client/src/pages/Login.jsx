import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Notice } from '../components.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await login(username.trim(), password);
      if (response.ok) {
        const target = params.get('next') || (response.data.user.role === 'admin' ? '/admin' : '/account');
        navigate(target, { replace: true });
      } else {
        setError(response.data?.error || 'Incorrect username or password.');
      }
    } catch {
      setError('Could not reach the store. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <div className="auth-layout">
        <div className="panel auth-card">
          <div className="panel-kicker">Signed in</div>
          <h1>You are already signed in.</h1>
          <p className="muted-copy">Continue to your account or head back to the store.</p>
          <div className="button-row">
            <Link className="btn primary" to="/account">Open account</Link>
            <Link className="btn" to="/">Back to store</Link>
          </div>
        </div>
        <aside className="auth-aside">
          <div className="panel-kicker">Northwind Supply</div>
          <h2>Workspace essentials, delivered.</h2>
          <p>Member pricing, Net-30 terms and a straightforward returns policy.</p>
        </aside>
      </div>
    );
  }

  return (
    <div className="auth-layout">
      <form className="panel auth-card" onSubmit={submit}>
        <div className="panel-kicker">Member access</div>
        <h1>Sign in</h1>
        <p className="muted-copy">Use your Northwind account to continue.</p>

        {error ? <Notice tone="error">{error}</Notice> : null}

        <label>
          <span>Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button className="btn primary full" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="auth-help">
          Trouble signing in? <a href="mailto:support@northwind.example">Contact support</a>.
        </p>
      </form>

      <aside className="auth-aside">
        <div className="panel-kicker">Why Northwind</div>
        <h2>A simpler way to equip your team.</h2>
        <div className="benefit-list">
          <div className="benefit-row">
            <b>One account, every order</b>
            <p>Track purchases, quotes and store credit in one place.</p>
          </div>
          <div className="benefit-row">
            <b>Terms that fit</b>
            <p>Net-30 invoicing for approved teams, with no card on file.</p>
          </div>
          <div className="benefit-row">
            <b>Real support</b>
            <p>A small team answers every message, usually the same day.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
