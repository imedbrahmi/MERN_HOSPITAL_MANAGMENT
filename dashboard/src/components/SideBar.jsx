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
import { FaUsers } from 'react-icons/fa'
import { MdSchedule } from 'react-icons/md'
import { FaFileMedical } from 'react-icons/fa'
import { FaPrescription } from 'react-icons/fa'
import { FaFileInvoiceDollar } from 'react-icons/fa'
import { MdPersonAdd } from 'react-icons/md'
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

    const gotoPatientsPage = () => {
      navigateTo('/patients');
      setShow(!show);
    }

    const gotoSchedulePage = () => {
      navigateTo('/schedule');
      setShow(!show);
    }

    const gotoMedicalRecordsPage = () => {
      navigateTo('/medical-records');
      setShow(!show);
    }

    const gotoPrescriptionsPage = () => {
      navigateTo('/prescriptions');
      setShow(!show);
    }

    const gotoRegisterPatientPage = () => {
      navigateTo('/patients/register');
      setShow(!show);
    }

    const gotoInvoicesPage = () => {
      navigateTo('/invoices');
      setShow(!show);
    }

    const gotoAddNewReceptionist = () => {
      navigateTo('/receptionist/addnew');
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
         {/* Icônes pour Doctor */}
         {user && user.role === 'Doctor' && (
           <>
             <MdSchedule onClick={gotoSchedulePage} title="My Schedule"/>
             <FaUsers onClick={gotoPatientsPage} title="My Patients"/>
             <FaFileMedical onClick={gotoMedicalRecordsPage} title="Medical Records"/>
             <FaPrescription onClick={gotoPrescriptionsPage} title="Prescriptions"/>
           </>
         )}
         {/* Icônes visibles pour Admin, Receptionist et SuperAdmin (pas pour Doctor) */}
         {user && user.role !== 'Doctor' && (
           <>
             <FaUserDoctor onClick={gotoDoctorsPage}/>
             {user.role !== 'Receptionist' && (
               <IoPersonAddSharp onClick={gottoAddNewDoctor}/>
             )}
             <FaUsers onClick={gotoPatientsPage} title="Patients"/>
             {/* Icônes pour Receptionist */}
             {user.role === 'Receptionist' && (
               <>
                 <IoPersonAddSharp onClick={gotoRegisterPatientPage} title="Register Patient"/>
                 <FaFileInvoiceDollar onClick={gotoInvoicesPage} title="Invoices"/>
               </>
             )}
             {/* Icônes pour Admin */}
             {user.role === 'Admin' && (
               <>
                 <MdPersonAdd onClick={gotoAddNewReceptionist} title="Add Receptionist"/>
                 <FaFileInvoiceDollar onClick={gotoInvoicesPage} title="Invoices"/>
               </>
             )}
           </>
         )}
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