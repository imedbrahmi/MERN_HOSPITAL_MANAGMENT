import React, { useState, useContext } from 'react';
import { Context } from '../main';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';


const Login = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(Context);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigateTo = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      return toast.error('Please fill all fields');
    }

    if (password !== confirmPassword) {
      return toast.error('Password and confirm password must match');
    }

    try {
      const response = await axios.post(
        'http://localhost:4000/api/v1/user/login',
        { email, password, confirmPassword,role: 'Patient' },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      toast.success(response.data.message);
      setIsAuthenticated(true);
      navigateTo('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      setIsAuthenticated(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className='container form-component login-form'>
      <h2>Sign In</h2>
      <p>Welcome back! Please enter your details.</p>
      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
      <form onSubmit={handleLogin}>
        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type='password'
          placeholder='Confirm Password'
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <div
          style={{
            gap: '10px',
            display: 'flex',
            justifyContent: 'flex-end',
            flexDirection: 'row',
          }}
        >
          <p style={{ marginBottom: 0 }}>
            Don't have an account?{' '}
            <Link
              to={'/register'}
              style={{ textDecoration: 'none', alignItems: 'center', color: 'blue' }}
            >
              Register Now
            </Link>
          </p>
        </div>
        <div style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
          <button type='submit'>Login</button>
        </div>
      </form>
    </div>
  );
};

export default Login;