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

const App = () => {
  const { setIsAuthenticated, setUser } = useContext(Context);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/v1/user/patient/me",
          {
            withCredentials: true,
          }
        );
        if (response.data && response.data.user) {
          setIsAuthenticated(true);
          setUser(response.data.user);
          console.log("Patient authenticated on mount:", response.data.user);
        } else {
          console.log("No user data in response");
          setIsAuthenticated(false);
          setUser({});
        }
      } catch (err) {
        // Si l'erreur est 401 ou 400, l'utilisateur n'est pas authentifié (normal)
        // On ne fait rien, juste on s'assure que l'état est correct
        const status = err.response?.status;
        const errorMessage = err.response?.data?.message || err.message;
        if (status === 401 || status === 400) {
          console.log("User not authenticated (status:", status, "message:", errorMessage, ")");
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
