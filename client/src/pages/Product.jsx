import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatTime } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Notice, PageHead, ProductArt, Stars } from '../components.jsx';

function initials(value) {
  return String(value || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function Product() {
  const { id } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, product: null, reviews: [], renderRichText: false, error: '' });
  const [author, setAuthor] = useState(user?.username || '');
  const [rating, setRating] = useState('5');
  const [content, setContent] = useState('');
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const response = await api(`/api/products/${id}`);
      if (response.ok) {
        setState({
          loading: false,
          product: response.data.product,
          reviews: response.data.reviews || [],
          renderRichText: Boolean(response.data.renderRichText),
          error: ''
        });
      } else {
        setState({ loading: false, product: null, reviews: [], renderRichText: false, error: response.data?.error || 'Product not found.' });
      }
    } catch {
      setState({ loading: false, product: null, reviews: [], renderRichText: false, error: 'Could not reach the store.' });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user?.username && !author) setAuthor(user.username);
  }, [user, author]);

  const submit = async (event) => {
    event.preventDefault();
    setNotice(null);
    setSubmitting(true);
    try {
      const response = await api(`/api/products/${id}/reviews`, {
        method: 'POST',
        body: { author, content, rating: Number(rating) }
      });
      if (response.ok) {
        setContent('');
        setRating('5');
        setNotice({ tone: 'success', text: 'Thanks — your review has been published.' });
        await load();
      } else {
        setNotice({ tone: 'error', text: response.data?.error || 'Could not publish your review.' });
      }
    } catch {
      setNotice({ tone: 'error', text: 'Could not reach the store.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (state.loading) {
    return <div className="loading-line">Loading product…</div>;
  }

  if (state.error || !state.product) {
    return (
      <div>
        <Notice tone="error">{state.error || 'Product not found.'}</Notice>
        <Link className="btn" to="/catalog">Back to catalog</Link>
      </div>
    );
  }

  const { product, reviews, renderRichText } = state;
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
    : 0;

  return (
    <div>
      <PageHead
        kicker={<><Link className="crumb" to="/catalog">Catalog</Link> · {product.category}</>}
        title={product.name}
        lead={product.description}
      />

      <div className="product-detail">
        <div className="detail-media">
          <ProductArt product={product} size="detail" />
        </div>
        <div className="detail-body">
          <div className="detail-meta">
            <span>{product.category}</span>
            <span>SKU {product.sku}</span>
            <span className="in-stock">In stock</span>
          </div>
          <div className="detail-price">${Number(product.price).toFixed(2)}</div>
          <p className="detail-copy">
            Ships within one business day. Member pricing and Net-30 terms are applied
            automatically at checkout for approved accounts.
          </p>
          <div className="detail-actions">
            <a className="btn primary" href={`mailto:sales@northwind.example?subject=${encodeURIComponent(`Quote request: ${product.name}`)}`}>
              Request a quote
            </a>
            <Link className="btn" to="/catalog">Continue shopping</Link>
          </div>
          <div className="detail-facts">
            <div><span>Warranty</span><b>2 years</b></div>
            <div><span>Returns</span><b>30 days</b></div>
            <div><span>Shipping</span><b>Free over $75</b></div>
          </div>
        </div>
      </div>

      <section className="reviews-section">
        <div className="section-heading">
          <div>
            <h2>Reviews</h2>
            <p>{reviews.length ? `${reviews.length} verified ${reviews.length === 1 ? 'review' : 'reviews'} from members.` : 'No reviews yet — be the first to share your experience.'}</p>
          </div>
          {reviews.length ? <Stars rating={average} showValue /> : null}
        </div>

        {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

        <div className="review-layout">
          <div className="review-list">
            {reviews.length === 0 ? (
              <div className="empty-panel"><h3>No reviews yet</h3><p>Reviews help other members choose with confidence.</p></div>
            ) : reviews.map((review) => (
              <article className="review" key={review.id}>
                <div className="review-head">
                  <span className="avatar">{initials(review.author)}</span>
                  <div>
                    <b>{review.author}</b>
                    <small>{formatTime(review.created_at)}</small>
                  </div>
                  <Stars rating={review.rating} />
                </div>
                {renderRichText ? (
                  <div className="review-body injected" dangerouslySetInnerHTML={{ __html: review.content }} />
                ) : (
                  <div className="review-body">{review.content}</div>
                )}
              </article>
            ))}
          </div>

          <form className="panel review-form" onSubmit={submit}>
            <h3>Write a review</h3>
            <p className="hint">Share what worked and what could be better.</p>
            <label>
              <span>Your name</span>
              <input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Name" maxLength={60} required />
            </label>
            <label>
              <span>Rating</span>
              <select value={rating} onChange={(event) => setRating(event.target.value)}>
                <option value="5">5 — Excellent</option>
                <option value="4">4 — Good</option>
                <option value="3">3 — Okay</option>
                <option value="2">2 — Poor</option>
                <option value="1">1 — Bad</option>
              </select>
            </label>
            <label>
              <span>Review</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Tell us about your experience…"
                rows={5}
                maxLength={2000}
                required
              />
            </label>
            <button className="btn primary full" type="submit" disabled={submitting}>
              {submitting ? 'Publishing…' : 'Publish review'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
