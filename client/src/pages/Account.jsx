import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatMoney, formatTime } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Notice, PageHead } from '../components.jsx';

export default function Account() {
  const { user, loading, csrfToken, refresh } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login?next=/account', { replace: true });
  }, [loading, user, navigate]);

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await api('/api/account');
      if (response.ok) setData(response.data);
      else setError(response.data?.error || 'Could not load your account.');
    } catch {
      setError('Could not reach the store.');
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const submit = async (event) => {
    event.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      const response = await api('/api/account/transfer', {
        method: 'POST',
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
        body: { to: to.trim(), amount: Number(amount) }
      });
      if (response.ok) {
        setNotice({ tone: 'success', text: response.data.message || 'Transfer complete.' });
        setTo('');
        setAmount('');
        await Promise.all([load(), refresh()]);
      } else {
        setNotice({ tone: 'error', text: response.data?.error || 'Could not complete the transfer.' });
      }
    } catch {
      setNotice({ tone: 'error', text: 'Could not reach the store.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) return null;

  const balance = data?.user?.balance ?? user.balance;
  const transfers = data?.transfers || [];

  return (
    <div>
      <PageHead
        kicker="Workspace"
        title="Account"
        lead="Your profile, store credit and recent activity."
      >
        <span className="pill">{user.role}</span>
        {user.role === 'admin' ? <Link className="btn" to="/admin">Operations</Link> : null}
      </PageHead>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="account-grid">
        <section className="panel">
          <div className="panel-kicker">Profile</div>
          <div className="profile-rows">
            <div><span>Username</span><b>{user.username}</b></div>
            <div><span>Email</span><b>{user.email}</b></div>
            <div><span>Account type</span><b>{user.role === 'admin' ? 'Administrator' : 'Member'}</b></div>
          </div>
        </section>

        <section className="panel balance-panel">
          <div className="panel-kicker">Store credit</div>
          <div className="balance-value">${formatMoney(balance)}</div>
          <p className="hint">Credit can be used on any order or sent to another member.</p>
        </section>
      </div>

      <div className="account-grid account-grid-wide">
        <section className="panel">
          <div className="panel-heading">
            <h2>Send store credit</h2>
          </div>
          {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
          <form className="transfer-form" onSubmit={submit}>
            <label>
              <span>Recipient username</span>
              <input value={to} onChange={(event) => setTo(event.target.value)} placeholder="Recipient username" required />
            </label>
            <label>
              <span>Amount</span>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
                required
              />
            </label>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send credit'}
            </button>
          </form>
          <p className="hint">Transfers are final. Double-check the recipient before sending.</p>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Recent activity</h2>
            <span className="hint">Last 20</span>
          </div>
          {!data ? <div className="loading-line">Loading activity…</div> : null}
          {data && transfers.length === 0 ? (
            <div className="empty-panel"><h3>No activity yet</h3><p>Transfers you send or receive will appear here.</p></div>
          ) : null}
          {transfers.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Details</th><th className="align-right">Amount</th></tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => {
                    const outgoing = transfer.from_user === user.username;
                    return (
                      <tr key={transfer.id}>
                        <td>{formatTime(transfer.created_at)}</td>
                        <td>
                          {outgoing ? 'To ' : 'From '}
                          <b>{outgoing ? transfer.to_user : transfer.from_user}</b>
                        </td>
                        <td className={`align-right ${outgoing ? 'amount-out' : 'amount-in'}`}>
                          {outgoing ? '−' : '+'}${formatMoney(transfer.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
