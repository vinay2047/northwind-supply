import React from 'react';
import { Link, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Product from './pages/Product.jsx';
import Login from './pages/Login.jsx';
import Account from './pages/Account.jsx';
import Admin from './pages/Admin.jsx';
import Diagnostics from './pages/Diagnostics.jsx';

function Sidebar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await logout();
    navigate('/');
  }

  return (
    <aside className="sidebar">
      <Link to="/" className="brand">
        <span className="brand-mark">N</span>
        <span>
          <b>Northwind Supply</b>
          <small>Workspace essentials</small>
        </span>
      </Link>

      <div className="nav-label">Shop</div>
      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-number">01</span>
          <span className="nav-text"><b>Store</b><small>Featured products</small></span>
        </NavLink>
        <NavLink to="/catalog" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-number">02</span>
          <span className="nav-text"><b>Catalog</b><small>Browse everything</small></span>
        </NavLink>
      </nav>

      <div className="nav-label">Workspace</div>
      <nav className="nav">
        <NavLink to="/account" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-number">03</span>
          <span className="nav-text"><b>Account</b><small>Profile and credit</small></span>
        </NavLink>
        {user?.role === 'admin' ? (
          <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-number">04</span>
            <span className="nav-text"><b>Admin</b><small>Operations overview</small></span>
          </NavLink>
        ) : null}
      </nav>

      <div className="sidebar-bottom">
        {!loading && user ? (
          <div className="sidebar-user">
            <span className="user-mark">{user.username.slice(0, 1).toUpperCase()}</span>
            <div>
              <b>{user.username}</b>
              <small>{user.email}</small>
            </div>
            <button type="button" className="text-button" onClick={signOut}>Sign out</button>
          </div>
        ) : (
          <Link className="btn primary full" to="/login">Sign in</Link>
        )}
        <div className="sidebar-note">
          <p>Questions about an order? Email <a href="mailto:support@northwind.example">support@northwind.example</a>.</p>
        </div>
      </div>
    </aside>
  );
}

function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <div className="mobile-bar">
          <Link to="/" className="brand compact">
            <span className="brand-mark">N</span>
            <b>Northwind Supply</b>
          </Link>
          <Link className="btn tiny ghost" to="/account">Account</Link>
        </div>
        <Outlet />
        <footer className="footer">
          <span>Northwind Supply · Workspace essentials</span>
          <span>support@northwind.example</span>
        </footer>
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>We couldn't find that page.</p>
      <Link className="btn primary" to="/">Back to the store</Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/products/:id" element={<Product />} />
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/diagnostics" element={<Diagnostics />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
