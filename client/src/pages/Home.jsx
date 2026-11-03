import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatMoney } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Notice, ProductCard, SectionHeading } from '../components.jsx';

const CATEGORIES = [
  { name: 'Desk', blurb: 'Keyboards, mice and lighting' },
  { name: 'Audio', blurb: 'Headsets for focused work' },
  { name: 'Accessories', blurb: 'Hubs, cables and adapters' },
  { name: 'Security', blurb: 'Keys and privacy tools' }
];

const BENEFITS = [
  ['Member pricing', 'Preferred rates on every order, with no minimum spend.'],
  ['Net-30 terms', 'Approved teams can order now and settle at month end.'],
  ['Simple returns', 'Thirty days to change your mind, no restocking fees.']
];

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api('/api/products')
      .then((response) => {
        if (!active) return;
        if (response.ok) setProducts(response.data.products.slice(0, 4));
        else setError(response.data?.error || 'Could not load featured products.');
      })
      .catch(() => {
        if (active) setError('Could not reach the store.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <section className="shop-hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" />Northwind Supply · Workspace essentials</div>
          <h1>Everything your team needs to do its best work.</h1>
          <p>
            Considered tools for the desk, the studio and everywhere in between.
            Built to last, priced for teams, and ready to ship.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" to="/catalog">Browse the catalog</Link>
            {user ? (
              <Link className="btn" to="/account">View account</Link>
            ) : (
              <Link className="btn" to="/login">Sign in</Link>
            )}
          </div>
          <div className="hero-meta">
            <span><b>8</b> products</span>
            <span><b>30-day</b> returns</span>
            <span><b>Net-30</b> for teams</span>
          </div>
        </div>

        <aside className="hero-panel">
          {user ? (
            <>
              <div className="panel-kicker">Your account</div>
              <h2>{user.username}</h2>
              <p className="hero-panel-copy">{user.email}</p>
              <div className="hero-balance">
                <span>Store credit</span>
                <b>${formatMoney(user.balance)}</b>
              </div>
              <Link className="btn full" to="/account">Open account</Link>
            </>
          ) : (
            <>
              <div className="panel-kicker">Member benefits</div>
              <h2>Built for the way teams buy.</h2>
              <div className="benefit-list">
                {BENEFITS.map(([title, copy]) => (
                  <div key={title} className="benefit-row">
                    <b>{title}</b>
                    <p>{copy}</p>
                  </div>
                ))}
              </div>
              <Link className="btn full" to="/login">Sign in to your account</Link>
            </>
          )}
        </aside>
      </section>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <SectionHeading
        title="Shop by category"
        lead="A small, deliberate range — nothing you have to scroll past."
      />
      <div className="category-grid">
        {CATEGORIES.map((category) => (
          <Link key={category.name} className="category-card" to={`/catalog?q=${encodeURIComponent(category.name)}`}>
            <b>{category.name}</b>
            <span>{category.blurb}</span>
            <small>Browse →</small>
          </Link>
        ))}
      </div>

      <SectionHeading
        title="Featured this week"
        lead="The pieces our team keeps coming back to."
        action={<Link className="text-link" to="/catalog">View all products →</Link>}
      />

      {!products && !error ? <div className="loading-line">Loading products…</div> : null}
      {products ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}

      <section className="closing-panel">
        <div>
          <div className="panel-kicker">Need a hand?</div>
          <h2>Talk to a human.</h2>
          <p>
            Our team can help with bulk orders, quotes and account setup.
            Reach us at <a href="mailto:hello@northwind.example">hello@northwind.example</a>.
          </p>
        </div>
        <a className="btn" href="mailto:hello@northwind.example">Contact us</a>
      </section>
    </div>
  );
}
