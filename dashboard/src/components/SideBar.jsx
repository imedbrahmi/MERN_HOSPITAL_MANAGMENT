import React from 'react'
import { useState, useContext } from 'react'
import { Context } from '../main'
import { TiHome} from 'react-icons/ti'
import { RiLogoutBoxLine} from 'react-icons/ri'
import { AiFillMessage} from 'react-icons/ai'
import { GiHamburgerMenu} from 'react-icons/gi'
import{IoPersonAddSharp} from 'react-icons/io5'
import{MdAddModerator} from 'react-icons/md'
import { FaUserDoctor } from 'react-icons/fa6'
import { FaHospital } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'



const SideBar = () => {
    const [show, setShow] = useState(false);
    const {isAuthenticated, setIsAuthenticated, user } = useContext(Context)

    const navigateTo = useNavigate()

    const gotoHome = () => {
       navigateTo('/');
       setShow(!show);
    }
    const gotoDoctorsPage = () => {
      navigateTo('/doctors');
      setShow(!show);
    }

    const gotoMessagesPage = () => {
      navigateTo('/messages');
      setShow(!show);
    }

    const gottoAddNewDoctor = () => {
      navigateTo('/doctor/addnew');
      setShow(!show);
    }

    const gottoAddNewAdmin = () => {
      navigateTo('/admin/addnew');
      setShow(!show);
    }

    const gotoClinicsPage = () => {
      navigateTo('/clinics');
      setShow(!show);
    }

    const handelLogout = async() => {
      try {
          const res = await axios.get("http://localhost:4000/api/v1/user/admin/logout", {
              withCredentials: true,
          });
          toast.success(res.data.message);
          setIsAuthenticated(false);
          navigateTo('/');
      } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to logout');
      }
   }


  return (
    <>
      {''}
      <nav style={!isAuthenticated ? {display: 'none'} : {display: 'flex'}} 
      className={show ? 'show sidebar' : 'sidebar'}>
        <div className='links'>
         <TiHome onClick={gotoHome}/>
         {/* Icônes visibles uniquement pour SuperAdmin */}
         {user && user.role === 'SuperAdmin' && (
           <>
             <FaHospital onClick={gotoClinicsPage} title="Manage Clinics"/>
             <MdAddModerator onClick={gottoAddNewAdmin} title="Add New Admin"/>
           </>
         )}
         <FaUserDoctor onClick={gotoDoctorsPage}/>
         <IoPersonAddSharp onClick={gottoAddNewDoctor}/>
         <AiFillMessage onClick={gotoMessagesPage}/>
         <RiLogoutBoxLine onClick={handelLogout}/>
        </div>

      </nav>
      <div style={!isAuthenticated ? {display: 'none'} : {display: 'flex'}} className="wrapper" >
        <GiHamburgerMenu className='hamburger' onClick={() => setShow(!show)}/>

      </div>
    </>
  )
}

export default SideBar