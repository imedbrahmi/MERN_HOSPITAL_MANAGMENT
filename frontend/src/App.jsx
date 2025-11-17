import React, { useContext, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import Appointment from './pages/Appointment';
import AboutUs from './pages/AboutUs';
import Register from './pages/Register';
import Login from './pages/Login';
import MyAppointments from './pages/MyAppointments';
import MyInvoices from './pages/MyInvoices';
import MyPrescriptions from './pages/MyPrescriptions';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NavBar from './components/NavBar';
import axios from 'axios';
import { Context } from './main';
import Footer from './components/Footer';
import { API_BASE_URL } from './utils/api';

const App = () => {
  const { setIsAuthenticated, setUser } = useContext(Context);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/user/patient/me`,
          {
            withCredentials: true,
          }
        );
        if (response.data && response.data.user) {
          setIsAuthenticated(true);
          setUser(response.data.user);
        } else {
          setIsAuthenticated(false);
          setUser({});
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 400) {
          setIsAuthenticated(false);
          setUser({});
        } else {
          console.error("Error fetching user:", err.response?.data || err.message);
          setIsAuthenticated(false);
          setUser({});
        }
      }
    };

    fetchUser();
  }, [setIsAuthenticated, setUser]);

  return (
    <>
      <Router>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/my-invoices" element={<MyInvoices />} />
          <Route path="/my-prescriptions" element={<MyPrescriptions />} />
        </Routes>
        <Footer />
      </Router>
      <ToastContainer 
        position="top-center" 
        autoClose={5000} 
        hideProgressBar={false} 
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={true}
        draggable={true}
        pauseOnHover={true}
        theme="light"
      />
    </>
  );
};

export default App;
