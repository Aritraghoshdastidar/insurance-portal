import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // We'll use useNavigate to redirect

function RegistrationPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate(); // Hook for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Basic client-side validation so tests which simulate submits without browser
      // validation behave consistently in the test environment.
      if (!name || !email || !password) {
        setError('Please fill in all required fields');
        return;
      }
      // Simple email format check
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email)) {
        setError('Please provide a valid email address');
        return;
      }
      // Call the /api/register endpoint we already built
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Registration successful! Redirecting to login...');
      // Immediately navigate (tests expect immediate redirect)
      navigate('/login');

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container"> {/* We can reuse the login-container style */}
      <form onSubmit={handleSubmit}>
        <h2>Create an Account</h2>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
      <p className="form-footer-link">
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
}

export default RegistrationPage;