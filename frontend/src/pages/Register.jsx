import React, { useContext, useState, useEffect } from 'react';
import { Context } from '../main';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Register = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(Context);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [CIN, setCIN] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinics, setClinics] = useState([]);

  const navigateTo = useNavigate();

  // Récupérer la liste des cliniques au chargement
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const { data } = await axios.get('http://localhost:4000/api/v1/clinics');
        setClinics(data.clinics || []);
      } catch (error) {
        console.error('Error fetching clinics:', error);
      }
    };
    fetchClinics();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!firstName || !lastName || !phone || !CIN || !email || !dob || !gender || !password || !confirmPassword) {
      return toast.error('Please fill all fields');
    }

    if (password !== confirmPassword) {
      return toast.error('Password and confirm password must match');
    }

    if (!clinicName) {
      return toast.error('Please select a clinic');
    }

    try {
      const response = await axios.post(
        'http://localhost:4000/api/v1/user/patient/register',
        { firstName, lastName, phone, CIN, email, dob, gender, password, confirmPassword, role: 'Patient', clinicName },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      toast.success(response.data.message);
      setIsAuthenticated(true);
      navigateTo('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      setIsAuthenticated(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={'/'} replace />;
  }

  return (
    <div className='container form-component register-form'>
      <h2>Register</h2>
      <p>Welcome to our platform! Please fill in your details.</p>
      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
      <form onSubmit={handleRegister}>
        <div>
          <input
            type='text'
            placeholder='First Name'
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            type='text'
            placeholder='Last Name'
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div>
          <input
            type='email'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type='tel'
            placeholder='Phone'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <input
            type='text'
            placeholder='CIN'
            value={CIN}
            onChange={(e) => setCIN(e.target.value)}
          />
          <input
            type='date'
            placeholder='Date of Birth'
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
        <div>
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value='' disabled>
              Select Gender
            </option>
            <option value='Male'>Male</option>
            <option value='Female'>Female</option>
          </select>
          <select 
            value={clinicName} 
            onChange={(e) => setClinicName(e.target.value)}
            required
            style={{ width: '100%' }}
          >
            <option value='' disabled>Select Clinic *</option>
            {clinics.map((clinic) => (
              <option key={clinic._id} value={clinic.name}>
                {clinic.name}
              </option>
            ))}
          </select>
        </div>
        <div>
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
        </div>
        <div
          style={{
            gap: '10px',
            display: 'flex',
            justifyContent: 'flex-end',
            flexDirection: 'row',
          }}
        >
          <p style={{ marginBottom: 0 }}>
            Already have an account?{' '}
            <Link
              to={'/login'}
              style={{ textDecoration: 'none', alignItems: 'center', color: 'blue' }}
            >
              Login Now
            </Link>
          </p>
        </div>
        <div style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
          <button type='submit'>Register</button>
        </div>
      </form>
    </div>
  );
};

export default Register;