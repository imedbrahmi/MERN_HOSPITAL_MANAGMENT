import React, { useContext, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Context } from '../main';
import {GiHamburgerMenu} from 'react-icons/gi'

const NavBar = () => {
    const [show, setShow] = useState(false);
    const {isAuthenticated,setIsAuthenticated} = useContext(Context)
    const navigateTo = useNavigate();
     const handelLogout = async() => {
        try {
            const res = await axios.get("http://localhost:4000/api/v1/user/patient/logout", {
                withCredentials: true,
            });
            toast.success(res.data.message);
            setIsAuthenticated(false);
            navigateTo('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to logout');
        }
     }
     const gotoLogin = () => {
        navigateTo('/login');
     }

  return (
    <nav className='container'>
        <div className='logo'>ZeeCare</div>
        <div className={show ? 'navLinks showmenu' : 'navLinks'}>
            <div className='links'>
                <Link to="/">HOME</Link>
                <Link to="/appointment">APPOINTMENT</Link>
                <Link to="/about">ABOUT US</Link>
               
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
