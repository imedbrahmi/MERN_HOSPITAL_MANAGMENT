import React, { useContext, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import AddNewDoctor from './components/AddNewDoctor'
import AddNewAdmin from './components/AddNewAdmin'
import Doctors from './components/Doctors'
import Messages from './components/Messages'
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
        <Route path='/doctors' element={
          <RouteGuard requireAuth={true} allowedRoles={['Admin', 'SuperAdmin']}>
            <Doctors />
          </RouteGuard>
        } />
        <Route path='/messages' element={
          <RouteGuard requireAuth={true} allowedRoles={['Admin', 'SuperAdmin']}>
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
      </Routes>
      <ToastContainer position="top-center"/>
    </Router>
    </>
  );
};

export default App;
