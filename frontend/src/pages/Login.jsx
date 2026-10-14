// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handlePasswordReset = async () => {
    setResetFeedback('');
    if (!email.trim()) {
      setResetFeedback('Enter your email address above first.');
      return;
    }
    setResetLoading(true);
    try {
      const result = await authService.requestPasswordReset(email);
      setResetFeedback(result.message);
    } catch (error) {
      setResetFeedback(error.response?.data?.message || 'Could not send a reset email. Please try again later.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/boarder');
      }
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        
        {/* Left Side */}
        <section className="login-brand-panel">
          <div className="login-logo">
            <span className="login-logo-badge">H</span>
            HostelSync
          </div>

          <div className="login-brand-content">
            <div className="login-tagline">YOUR HOSTEL, IN SYNC</div>
            <h1 className="login-hero-heading">
              Everything hostel,<br />all in one place.
            </h1>
            <p className="login-hero-subtext">
              Stay on top of your room, mess bills, notices, and more.
            </p>
          </div>

          <div className="login-footer-tagline">
            A simpler way to hostel life.
          </div>
        </section>

        {/* Right Side */}
        <section className="login-form-panel">
          <div className="login-welcome-tag">WELCOME BACK</div>
          <h2 className="login-title">Sign in to your account</h2>
          <p className="login-subtitle">Enter your details to access your HostelSync portal.</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="login-input"
                placeholder="boarder1@hostelsync.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <div className="login-field-header">
                <label htmlFor="password">Password</label>
                <button type="button" className="reset-password-btn" onClick={handlePasswordReset} disabled={resetLoading}>
                  {resetLoading ? 'Sending…' : 'Reset password'}
                </button>
              </div>
              <div className="login-password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="login-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            {resetFeedback && <p className="login-reset-feedback" role="status">{resetFeedback}</p>}

            {feedback && (
              <p className="login-feedback" role="status">
                {feedback}
              </p>
            )}

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="login-register-row">
            <span>New to HostelSync?</span>
            <Link to="/register" className="login-register-link">
              Sign up / Register
            </Link>
          </div>

          <p className="login-help-text">
            Need help signing in? Contact your hostel administrator.
          </p>
        </section>
      </div>
    </div>
  );
}
