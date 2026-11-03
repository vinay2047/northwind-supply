import React from 'react';
import { Link } from 'react-router-dom';

export function PageHead({ kicker, title, lead, children }) {
  return (
    <header className="page-head">
      <div>
        {kicker ? <div className="eyebrow">{kicker}</div> : null}
        <h1>{title}</h1>
        {lead ? <p className="page-lead">{lead}</p> : null}
      </div>
      {children ? <div className="page-head-side">{children}</div> : null}
    </header>
  );
}

export function ProductArt({ product, size = 'card' }) {
  const name = product?.name || '';
  const initials = String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`product-art product-art-${size}`} aria-hidden="true">
      <span>{initials || 'N'}</span>
      {product?.category ? <small>{product.category}</small> : null}
    </div>
  );
}

export function Stars({ rating = 0, showValue = false }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="stars" aria-label={`${rating} out of 5`} title={`${rating} out of 5`}>
      <span aria-hidden="true">{'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}</span>
      {showValue ? <b>{Number(rating).toFixed(1)}</b> : null}
    </span>
  );
}

export function Notice({ children, tone = 'neutral' }) {
  return <div className={`notice notice-${tone}`}>{children}</div>;
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty-panel">
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}

export function ProductCard({ product }) {
  const price = Number(product.price);
  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <ProductArt product={product} />
      <div className="product-card-body">
        {product.category ? <div className="product-card-category">{product.category}</div> : null}
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-card-foot">
          <span className="price">{Number.isFinite(price) ? `$${price.toFixed(2)}` : String(product.price ?? '')}</span>
          <span className="product-link">View details</span>
        </div>
      </div>
    </Link>
  );
}

export function SectionHeading({ title, lead, action }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {lead ? <p>{lead}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return <div className="loading-line">{label}</div>;
}
