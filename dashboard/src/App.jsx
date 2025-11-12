import React, { useContext, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import AddNewDoctor from './components/AddNewDoctor'
import AddNewAdmin from './components/AddNewAdmin'
import Doctors from './components/Doctors'
import Patients from './components/Patients'
import Messages from './components/Messages'
import Schedule from './components/Schedule'
import MedicalRecords from './components/MedicalRecords'
import Prescriptions from './components/Prescriptions'
import RegisterPatient from './components/RegisterPatient'
import Invoices from './components/Invoices'
import AddNewReceptionist from './components/AddNewReceptionist'
import SideBar from './components/SideBar'
import Login from './components/Login'
import Clinics from './components/Clinics'
import EditClinic from './components/EditClinic'
import Onboarding from './components/Onboarding'
import RouteGuard from './components/RouteGuard'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Context } from './main'
import './App.css'



const App = () => {

const { isAuthenticated, setIsAuthenticated, setUser } = useContext(Context)
 useEffect(() => {
  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/v1/user/admin/me', {
        withCredentials: true
      })
      setUser(response.data.user)
      setIsAuthenticated(true)
    } catch (error) {
      console.log(error)
      setIsAuthenticated(false)
      setUser({})
    }
  }
  fetchUser()
 }, [isAuthenticated]);


  return (
    <>
    <Router>
    <SideBar />
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/' element={
          <RouteGuard requireAuth={true}>
            <Dashboard />
          </RouteGuard>
        } />
        <Route path='/doctor/addnew' element={
          <RouteGuard requireAuth={true} allowedRoles={['Admin', 'SuperAdmin']}>
            <AddNewDoctor />
          </RouteGuard>
        } />
        <Route path='/admin/addnew' element={
          <RouteGuard requireAuth={true} allowedRoles={['SuperAdmin']}>
            <AddNewAdmin />
          </RouteGuard>
        } />
        <Route path='/receptionist/addnew' element={
          <RouteGuard requireAuth={true} allowedRoles={['Admin', 'SuperAdmin']}>
            <AddNewReceptionist />
          </RouteGuard>
        } />
        <Route path='/doctors' element={
          <RouteGuard requireAuth={true} allowedRoles={['Admin', 'SuperAdmin', 'Receptionist']}>
            <Doctors />
          </RouteGuard>
        } />
        <Route path='/patients' element={
          <RouteGuard requireAuth={true} allowedRoles={['Admin', 'SuperAdmin', 'Receptionist']}>
            <Patients />
          </RouteGuard>
        } />
        <Route path='/messages' element={
          <RouteGuard requireAuth={true} allowedRoles={['Admin', 'SuperAdmin', 'Receptionist']}>
            <Messages />
          </RouteGuard>
        } />
        <Route path='/clinics' element={
          <RouteGuard requireAuth={true} allowedRoles={['SuperAdmin']}>
            <Clinics />
          </RouteGuard>
        } />
        <Route path='/clinics/edit/:id' element={
          <RouteGuard requireAuth={true} allowedRoles={['SuperAdmin']}>
            <EditClinic />
          </RouteGuard>
        } />
        <Route path='/clinics/onboard' element={
          <RouteGuard requireAuth={true} allowedRoles={['SuperAdmin']}>
            <Onboarding />
          </RouteGuard>
        } />
        {/* Doctor Routes */}
        <Route path='/schedule' element={
          <RouteGuard requireAuth={true} allowedRoles={['Doctor']}>
            <Schedule />
          </RouteGuard>
        } />
        <Route path='/medical-records' element={
          <RouteGuard requireAuth={true} allowedRoles={['Doctor']}>
            <MedicalRecords />
          </RouteGuard>
        } />
        <Route path='/prescriptions' element={
          <RouteGuard requireAuth={true} allowedRoles={['Doctor']}>
            <Prescriptions />
          </RouteGuard>
        } />
        {/* Receptionist Routes */}
        <Route path='/patients/register' element={
          <RouteGuard requireAuth={true} allowedRoles={['Receptionist', 'Admin']}>
            <RegisterPatient />
          </RouteGuard>
        } />
        <Route path='/invoices' element={
          <RouteGuard requireAuth={true} allowedRoles={['Receptionist', 'Admin']}>
            <Invoices />
          </RouteGuard>
        } />
      </Routes>
      <ToastContainer position="top-center"/>
    </Router>
    </>
  );
};

export default App;
