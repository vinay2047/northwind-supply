import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Notice, PageHead } from '../components.jsx';

export default function Diagnostics() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [host, setHost] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login?next=/admin/diagnostics', { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  if (user.role !== 'admin') {
    return (
      <div>
        <PageHead kicker="Workspace · Admin" title="Network diagnostics" lead="Check outbound connectivity from the storefront server." />
        <Notice tone="error">You do not have access to this area.</Notice>
        <Link className="btn" to="/account">Back to account</Link>
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setBusy(true);
    try {
      const response = await api('/api/admin/diagnostics/ping', {
        method: 'POST',
        body: { host: host.trim() }
      });
      if (response.ok) setResult(response.data);
      else setError(response.data?.error || 'The check could not be completed.');
    } catch {
      setError('Could not reach the store.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHead
        kicker={<><Link className="crumb" to="/admin">Operations</Link> · Diagnostics</>}
        title="Network diagnostics"
        lead="Check outbound connectivity before enabling a webhook, payment provider or integration."
      />

      <div className="diagnostics-layout">
        <form className="panel" onSubmit={submit}>
          <div className="panel-kicker">Connectivity check</div>
          <h2>Run a host check</h2>
          <p className="hint">
            Enter a hostname or IP address. The storefront server will make a single
            outbound request and return the result.
          </p>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <label>
            <span>Host</span>
            <input
              value={host}
              onChange={(event) => setHost(event.target.value)}
              placeholder="hostname or IP address"
              required
            />
          </label>
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Running check…' : 'Run check'}
          </button>
          <p className="hint">Checks time out after five seconds.</p>
        </form>

        <section className="panel console-panel">
          <div className="panel-heading">
            <h2>Result</h2>
            {result ? <span className="pill">Exit {result.exitCode}</span> : null}
          </div>
          {!result && !busy ? (
            <div className="empty-console">No check has been run yet.</div>
          ) : null}
          {busy ? <div className="empty-console">Running check…</div> : null}
          {result ? (
            <>
              <pre className="console-output">{result.output || 'No output'}</pre>
              <div className="console-meta">
                <span>Duration <b>{result.durationMs} ms</b></span>
                <span>Exit code <b>{result.exitCode}</b></span>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
