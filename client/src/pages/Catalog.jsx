import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { EmptyState, Notice, PageHead, ProductCard } from '../components.jsx';

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const [input, setInput] = useState(query);
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setInput(query);
  }, [query]);

  useEffect(() => {
    let active = true;
    setProducts(null);
    setError('');
    const path = query ? `/api/products?q=${encodeURIComponent(query)}` : '/api/products';
    api(path)
      .then((response) => {
        if (!active) return;
        if (response.ok) setProducts(response.data.products);
        else setError(response.data?.error || 'Could not load the catalog.');
      })
      .catch(() => {
        if (active) setError('Could not reach the store.');
      });
    return () => {
      active = false;
    };
  }, [query]);

  const submit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    const value = input.trim();
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next);
  };

  const clear = () => {
    setInput('');
    const next = new URLSearchParams(params);
    next.delete('q');
    setParams(next);
  };

  return (
    <div>
      <PageHead
        kicker="Catalog"
        title="Products"
        lead="A focused range of workspace essentials. Search by name, description or category."
      />

      <form className="search-form" onSubmit={submit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
        />
        <button className="btn primary" type="submit">Search</button>
        {query ? <button className="btn ghost" type="button" onClick={clear}>Clear</button> : null}
      </form>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {products ? (
        <div className="catalog-meta">
          <span>{products.length} {products.length === 1 ? 'product' : 'products'}</span>
          {query ? <span>for “{query}”</span> : null}
        </div>
      ) : null}

      {!products && !error ? <div className="loading-line">Loading products…</div> : null}

      {products && products.length === 0 ? (
        <EmptyState
          title="No products found"
          action={query ? <button className="btn" type="button" onClick={clear}>Clear search</button> : null}
        >
          {query ? `Nothing matched “${query}”. Try a different term.` : 'The catalog is empty right now.'}
        </EmptyState>
      ) : null}

      {products && products.length > 0 ? (
        <div className="product-grid">
          {products.map((product, index) => (
            <ProductCard key={`${product.id}-${index}`} product={product} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
