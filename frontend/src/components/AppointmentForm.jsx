import React, { useContext } from 'react'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Context } from '../main';



const AppointmentForm = () => {
    const { isAuthenticated } = useContext(Context);
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [CIN, setCIN] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [department, setDepartment] = useState('');
    const [doctorFirstName, setDoctorFirstName] = useState('');
    const [doctorLastName, setDoctorLastName] = useState('');
    const [hasVisited, setHasVisited] = useState(false);
    const [address, setAddress] = useState('');
    const [clinicName, setClinicName] = useState('');
    const [clinics, setClinics] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [availableDepartments, setAvailableDepartments] = useState([]);
    
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

    // Récupérer les docteurs et départements quand une clinique est sélectionnée
    useEffect(() => {
        const fetchDoctorsByClinic = async () => {
            if (!clinicName) {
                setDoctors([]);
                setAvailableDepartments([]);
                setDepartment('');
                setDoctorFirstName('');
                setDoctorLastName('');
                return;
            }
            
            try {
                const { data } = await axios.get(
                    `http://localhost:4000/api/v1/user/doctors/clinic/${encodeURIComponent(clinicName)}`
                );
                const clinicDoctors = data.doctors || [];
                setDoctors(clinicDoctors);
                
                // Extraire les départements uniques disponibles dans cette clinique
                const uniqueDepartments = [...new Set(clinicDoctors.map(doctor => doctor.doctorDepartment).filter(Boolean))];
                setAvailableDepartments(uniqueDepartments);
                
                // Réinitialiser le département et le docteur si la clinique change
                setDepartment('');
                setDoctorFirstName('');
                setDoctorLastName('');
            } catch (error) {
                console.error('Error fetching doctors by clinic:', error);
                setDoctors([]);
                setAvailableDepartments([]);
                toast.error('Failed to fetch doctors for this clinic');
            }
        };
        
        fetchDoctorsByClinic();
    }, [clinicName]);

    const handleAppointment = async (e) => {
        e.preventDefault();
        
        // Vérifier l'authentification
        if (!isAuthenticated) {
            toast.error('Please login first to book an appointment');
            navigate('/login');
            return;
        }
        
        try {
            const hasVisitedBool = Boolean(hasVisited);
            const {data} = await axios.post('http://localhost:4000/api/v1/appointment/post',
                {firstName,
                     lastName,
                    phone,
                    CIN,
                    email,
                    dob,
                    gender, 
                    appointment_date: appointmentDate,
                    department,
                    doctor_firstName: doctorFirstName,
                    doctor_lastName: doctorLastName,
                    hasVisited: hasVisitedBool,
                    address,
                    clinicName },
                {withCredentials: true,
                 headers: { "Content-Type": "application/json" }
                }
            );
            toast.success(data.message);
            setFirstName('');
            setLastName('');
            setPhone('');
            setCIN('');
            setEmail('');
            setDob('');
            setGender('');
            setAppointmentDate('');
            setDepartment('');
            setDoctorFirstName('');
            setDoctorLastName('');
            setHasVisited(false);
            setAddress('');
            setClinicName('');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to book appointment';
            toast.error(errorMessage);
            
            // Si l'erreur est 401 ou 403, rediriger vers la page de login
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.info('Please login to continue');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        }
    }
    return (
    <>
     <div className='container form-component appointment-form'>
      <h2>Appointments</h2>
      <p>Welcome to our platform! Please fill in your details to book an appointment.</p>
      
      <form onSubmit={handleAppointment}>
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
            type={dob ? 'date' : 'text'}
            placeholder='Date of Birth'
            value={dob}
            onFocus={(e) => (e.target.type = 'date')}
            onBlur={(e) => {
              if (!e.target.value) {
                e.target.type = 'text';
              }
            }}
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
          <input
            type={appointmentDate ? 'date' : 'text'}
            placeholder='Appointment Date'
            value={appointmentDate}
            onFocus={(e) => (e.target.type = 'date')}
            onBlur={(e) => {
              if (!e.target.value) {
                e.target.type = 'text';
              }
            }}
            onChange={(e) => setAppointmentDate(e.target.value)}
          />
        </div>
        <div>
          <select 
            value={clinicName} 
            onChange={(e) => setClinicName(e.target.value)}
            required
          >
            <option value='' disabled>Select Clinic</option>
            {clinics.map((clinic, index) => (
              <option value={clinic.name} key={clinic._id || index}>
                {clinic.name}
              </option>
            ))}
          </select>
          <select
            value={department}
            onChange={(e) => {
              const selectedDepartment = e.target.value;
              setDepartment(selectedDepartment);
              // Réinitialiser le docteur quand le département change
              setDoctorFirstName('');
              setDoctorLastName('');
            }}
            disabled={!clinicName || availableDepartments.length === 0}
          >
            <option value='' disabled>
              {!clinicName ? 'Select Clinic First' : availableDepartments.length === 0 ? 'No Departments Available' : 'Select Department'}
            </option>
            {availableDepartments.map((depart, index) => (
              <option value={depart} key={index}>
                {depart}
              </option>
            ))}
          </select>
          <select
            value={`${doctorFirstName} ${doctorLastName}`.trim()}
            onChange={(e) => {
              const [firstName, lastName = ''] = e.target.value.split(' ');
              setDoctorFirstName(firstName);
              setDoctorLastName(lastName);
            }}
            disabled={!department || !clinicName}
          >
            <option value=''>Select Doctor</option>
            {doctors
              .filter((doctor) => doctor.doctorDepartment === department)
              .map((doctor, index) => (
                <option
                  value={`${doctor.firstName} ${doctor.lastName}`}
                  key={doctor._id || index}
                >
                  {`${doctor.firstName} ${doctor.lastName}`}
                </option>
              ))}
          </select>
        </div>
          
           <textarea rows='4' value={address} onChange={(e) => setAddress(e.target.value)} placeholder='Address' />
        <div
          style={{
            gap: '10px',
            display: 'flex',
            justifyContent: 'flex-end',
            flexDirection: 'row',
          }}
        >
          <p style={{ marginBottom: 0 }}>
           Have you visited before?{' '}
           <input type = "checkbox" checked = {hasVisited} onChange={(e) => setHasVisited(e.target.checked)}
           style = {{flex: "none", width: "25px"}} />
          </p>
        </div>
        <div style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
          <button type='submit'>Get Appointment</button>
        </div>
      </form>
    </div>
    </>
  )
}

export default AppointmentForm