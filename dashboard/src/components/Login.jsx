import React from 'react'
import { Context } from '../main'
import { useState, useContext } from 'react'
import { toast } from 'react-toastify'
import { useNavigate, Navigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../utils/api'


const Login = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(Context);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();




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
        `${API_BASE_URL}/user/login`,
        { email, password, confirmPassword,role: 'Admin' },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      toast.success(response.data.message);
      setIsAuthenticated(true);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      setIsAuthenticated(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={"/"} />;
  }
  return (
    <>
    <div className='container form-component'>
      <img src='/logo.png' alt='logo' className='logo'/>
      <h1 className='form-title'>WELCOME TO ZEECARE</h1>
      <p>Only authorized Users can access this page</p>
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

        <div style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
          <button type='submit'>Login</button>
        </div>
      </form>
    </div>
    </>
  )
}

export default Login