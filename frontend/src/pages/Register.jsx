import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './Register.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [setupKey, setSetupKey] = useState('');
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);
  const [bootstrapChecked, setBootstrapChecked] = useState(false);
  const [accountType, setAccountType] = useState('BOARDER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    authService.getAdminBootstrapStatus()
      .then((status) => setBootstrapAvailable(Boolean(status.available)))
      .catch(() => setBootstrapAvailable(false))
      .finally(() => setBootstrapChecked(true));
  }, []);

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      if (accountType === 'ADMIN') {
        await authService.bootstrapAdmin(name, email, password, setupKey);
        setSuccess('The initial administrator account is ready. Sign in to open the admin dashboard.');
      } else {
        await authService.register(name, email, password);
        setSuccess('Your boarder account has been created. Sign in to continue.');
      }
      setName('');
      setEmail('');
      setPassword('');
      setSetupKey('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create the account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <aside className="register-brand-panel">
          <Link className="register-brand" to="/login"><span className="register-brand-mark">H</span><span>HostelSync</span></Link>
          <div className="register-brand-message"><span>YOUR HOSTEL, IN SYNC</span><h1>A better way<br />to hostel.</h1><p>One place for room updates, mess bills and everything happening in your community.</p></div>
          <p className="register-brand-foot">A simpler way to hostel life.</p>
        </aside>
        <main className="register-form-panel">
          <p className="register-eyebrow">GET STARTED</p>
          <h2>Create your account</h2>
          <p className="register-intro">Join HostelSync to manage your hostel experience.</p>

          {bootstrapChecked && bootstrapAvailable && <fieldset className="register-account-options"><legend>Account type</legend><label className={accountType === 'BOARDER' ? 'chosen' : ''}><input type="radio" name="accountType" value="BOARDER" checked={accountType === 'BOARDER'} onChange={() => setAccountType('BOARDER')} /><span><strong>Boarder</strong><small>Resident access</small></span></label><label className={accountType === 'ADMIN' ? 'chosen' : ''}><input type="radio" name="accountType" value="ADMIN" checked={accountType === 'ADMIN'} onChange={() => setAccountType('ADMIN')} /><span><strong>Initial admin</strong><small>One-time setup</small></span></label></fieldset>}

          {accountType === 'ADMIN' && bootstrapAvailable && <div className="register-setup-note">Initial administrator setup is open. You’ll need the one-time setup key configured by the system operator.</div>}
          {error && <div className="register-alert register-alert-error" role="alert">{error}</div>}
          {success && <div className="register-alert register-alert-success" role="status">{success}<Link to="/login">Go to sign in</Link></div>}

          <form className="register-form" onSubmit={handleRegister}>
            <label htmlFor="register-name">Full name</label>
            <input id="register-name" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" maxLength={100} required />
            <label htmlFor="register-email">Email address</label>
            <input id="register-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" maxLength={150} required />
            <label htmlFor="register-password">Password</label>
            <div className="register-password-wrap"><input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={accountType === 'ADMIN' ? 8 : undefined} required /><button type="button" className="register-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button></div>
            {accountType === 'ADMIN' && bootstrapAvailable && <><label htmlFor="register-setup-key">One-time setup key</label><input id="register-setup-key" type="password" autoComplete="off" value={setupKey} onChange={(event) => setSetupKey(event.target.value)} placeholder="Provided by the system operator" required /></>}
            <button type="submit" disabled={isLoading || Boolean(success)}>{isLoading ? 'Creating account…' : accountType === 'ADMIN' ? 'Create initial admin' : 'Create boarder account'}</button>
          </form>
          <p className="register-signin">Already registered? <Link to="/login">Sign in</Link></p>
        </main>
      </div>
    </div>
  );
}
