import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatMoney, formatTime } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Notice, PageHead } from '../components.jsx';

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/login?next=/admin', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    let active = true;
    api('/api/admin/overview')
      .then((response) => {
        if (!active) return;
        if (response.ok) setOverview(response.data);
        else setError(response.data?.error || 'Could not load the overview.');
      })
      .catch(() => {
        if (active) setError('Could not reach the store.');
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || !user) return null;

  if (user.role !== 'admin') {
    return (
      <div>
        <PageHead kicker="Workspace" title="Admin" lead="Operations overview." />
        <Notice tone="error">You do not have access to this area.</Notice>
        <Link className="btn" to="/account">Back to account</Link>
      </div>
    );
  }

  const stats = overview?.stats;
  const transfers = overview?.recentTransfers || [];
  const reviews = overview?.recentReviews || [];

  return (
    <div>
      <PageHead
        kicker="Workspace · Admin"
        title="Operations"
        lead="A snapshot of store activity and recent customer engagement."
      >
        <Link className="btn" to="/admin/diagnostics">Network diagnostics</Link>
      </PageHead>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {!overview && !error ? <div className="loading-line">Loading overview…</div> : null}

      {stats ? (
        <div className="stat-grid">
          <div className="stat-card"><span>Members</span><b>{stats.members}</b></div>
          <div className="stat-card"><span>Products</span><b>{stats.products}</b></div>
          <div className="stat-card"><span>Reviews</span><b>{stats.reviews}</b></div>
          <div className="stat-card"><span>Transfers</span><b>{stats.transfers}</b></div>
        </div>
      ) : null}

      {overview ? (
        <div className="admin-grid">
          <section className="panel">
            <div className="panel-heading">
              <h2>Recent transfers</h2>
              <span className="hint">Latest 8</span>
            </div>
            {transfers.length === 0 ? (
              <div className="empty-panel"><h3>No transfers</h3><p>Store credit transfers will appear here.</p></div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Date</th><th>From</th><th>To</th><th className="align-right">Amount</th></tr></thead>
                  <tbody>
                    {transfers.map((transfer) => (
                      <tr key={transfer.id}>
                        <td>{formatTime(transfer.created_at)}</td>
                        <td>{transfer.from_user}</td>
                        <td>{transfer.to_user}</td>
                        <td className="align-right">${formatMoney(transfer.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h2>Recent reviews</h2>
              <span className="hint">Latest 5</span>
            </div>
            {reviews.length === 0 ? (
              <div className="empty-panel"><h3>No reviews</h3><p>Customer reviews will appear here.</p></div>
            ) : (
              <div className="admin-review-list">
                {reviews.map((review) => (
                  <div className="admin-review" key={review.id}>
                    <div><b>{review.author}</b><span className="hint">{formatTime(review.created_at)}</span></div>
                    <p>{review.content}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
