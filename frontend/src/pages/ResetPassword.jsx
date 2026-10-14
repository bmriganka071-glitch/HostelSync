import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import './Login.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [feedback, setFeedback] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');
    if (password !== confirmation) {
      setFeedback('The passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.confirmPasswordReset(token, password);
      setFeedback(result.message);
      setSuccess(true);
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Could not reset your password. Request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <main className="reset-password-card">
        <div className="login-logo"><span className="login-logo-badge">H</span>HostelSync</div>
        <h1 className="login-title">Choose a new password</h1>
        {!token ? <p className="login-subtitle">This reset link is missing. Request a new one from the sign in page.</p> : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field"><label htmlFor="new-password">New password</label><input className="login-input" id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            <div className="login-field"><label htmlFor="confirm-password">Confirm new password</label><input className="login-input" id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>
            {feedback && <p className={success ? 'login-reset-feedback success' : 'login-feedback'} role={success ? 'status' : 'alert'}>{feedback}</p>}
            {!success && <button className="login-submit-btn" type="submit" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</button>}
          </form>
        )}
        <p className="login-register-row"><Link to="/login" className="login-register-link">Back to sign in</Link></p>
      </main>
    </div>
  );
}
