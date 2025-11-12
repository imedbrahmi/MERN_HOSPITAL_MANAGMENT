import React, { useContext, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Context } from '../main';
import {GiHamburgerMenu} from 'react-icons/gi'

const NavBar = () => {
    const [show, setShow] = useState(false);
    const {isAuthenticated, setIsAuthenticated, setUser} = useContext(Context)
    const navigateTo = useNavigate();
     const handelLogout = async() => {
        try {
            // Essayer de se déconnecter via l'API (si authentifié)
            try {
                const res = await axios.get("http://localhost:4000/api/v1/user/patient/logout", {
                    withCredentials: true,
                });
                toast.success(res.data.message);
            } catch (apiErr) {
                // Si l'API échoue (utilisateur non authentifié), on continue quand même
                // On supprime juste l'état local
                console.log("Logout API failed, clearing local state:", apiErr.response?.data?.message);
            }
            // Toujours mettre à jour l'état local et rediriger
            setIsAuthenticated(false);
            setUser({});
            navigateTo('/');
        } catch (err) {
            // En cas d'erreur inattendue, on nettoie quand même l'état local
            console.error("Logout error:", err);
            setIsAuthenticated(false);
            navigateTo('/');
        }
     }
     const gotoLogin = () => {
        navigateTo('/login');
     }

  return (
    <nav className='container navbar'>
        <div className='logo'>
            <img src='/logo.png' alt='ZeeCare logo' className='navbar-logo-img' />
        </div>
        <div className={show ? 'navLinks showmenu' : 'navLinks'}>
            <div className='links'>
                <Link to="/" onClick={() => { setShow(false); console.log("Navigating to /"); }}>HOME</Link>
                <Link to="/appointment" onClick={() => { setShow(false); console.log("Navigating to /appointment"); }}>APPOINTMENT</Link>
                {isAuthenticated && (
                  <>
                    <Link to="/my-appointments" onClick={() => { setShow(false); console.log("Navigating to /my-appointments"); }}>MY APPOINTMENTS</Link>
                    <Link to="/my-invoices" onClick={() => { setShow(false); console.log("Navigating to /my-invoices"); }}>MY INVOICES</Link>
                    <Link to="/my-prescriptions" onClick={() => { setShow(false); console.log("Navigating to /my-prescriptions"); }}>MY PRESCRIPTIONS</Link>
                  </>
                )}
                <Link to="/about" onClick={() => { setShow(false); console.log("Navigating to /about"); }}>ABOUT US</Link>
               
            </div>
            {isAuthenticated ? (
                <button className='logoutBtn btn' onClick={handelLogout}>LOGOUT</button>
            ) : (
                <button className='loginBtn btn' onClick={gotoLogin}>LOGIN</button>
            )}
        </div>
       <div className='hamburger' onClick={() => setShow(!show)}>
       <GiHamburgerMenu/>

       </div>
    </nav>
  )
}

export default NavBar
