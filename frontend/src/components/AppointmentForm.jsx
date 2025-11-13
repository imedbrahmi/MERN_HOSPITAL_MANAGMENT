import React, { useContext } from 'react'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Context } from '../main';



const AppointmentForm = () => {
    const { isAuthenticated, user } = useContext(Context);
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
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [loadingSlots, setLoadingSlots] = useState(false);
    
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

    // Si le patient est authentifié, pré-remplir les champs avec ses informations
    useEffect(() => {
        if (isAuthenticated && user && user.role === 'Patient') {
            if (user.firstName) setFirstName(user.firstName);
            if (user.lastName) setLastName(user.lastName);
            if (user.phone) setPhone(user.phone);
            if (user.CIN) setCIN(user.CIN);
            if (user.email) setEmail(user.email);
            if (user.dob) {
                // Convertir la date en format YYYY-MM-DD pour l'input date
                const dobDate = new Date(user.dob);
                const dobString = dobDate.toISOString().split('T')[0];
                setDob(dobString);
            }
            if (user.gender) setGender(user.gender);
        }
    }, [isAuthenticated, user]);

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
        
        // Vérifier que le patient est bien authentifié en vérifiant le cookie
        try {
            // Vérifier que le patient a bien un token en faisant une requête de vérification
            await axios.get('http://localhost:4000/api/v1/user/patient/me', {
                withCredentials: true
            });
        } catch (authError) {
            const errorMessage = authError.response?.data?.message || authError.message;
            const status = authError.response?.status;
            console.error('Authentication check failed:', {
                status,
                message: errorMessage,
                error: authError.response?.data
            });
            toast.error(errorMessage || 'Please login again to book an appointment');
            navigate('/login');
            return;
        }
        
        try {
            const hasVisitedBool = Boolean(hasVisited);
            
            // Vérifier qu'un créneau horaire a été sélectionné
            if (!selectedTimeSlot) {
                toast.error('Please select an available time slot');
                return;
            }
            
            // Préparer les données avec la date + heure complète
            // Format: YYYY-MM-DD HH:MM
            // Extraire seulement la date (sans l'heure si elle existe déjà)
            let dateOnly = appointmentDate;
            if (appointmentDate.includes('T')) {
                dateOnly = appointmentDate.split('T')[0];
            } else if (appointmentDate.includes(' ')) {
                dateOnly = appointmentDate.split(' ')[0];
            }
            const fullDateTime = `${dateOnly} ${selectedTimeSlot}`;
            
            const appointmentData = {
                firstName,
                lastName,
                phone,
                CIN,
                email,
                dob,
                gender, 
                appointment_date: fullDateTime,
                department,
                doctor_firstName: doctorFirstName,
                doctor_lastName: doctorLastName || "", // Permettre lastName vide
                hasVisited: hasVisitedBool,
                address,
                clinicName
            };
            
            console.log("Sending appointment data:", appointmentData);
            
            const {data} = await axios.post('http://localhost:4000/api/v1/appointment/post',
                appointmentData,
                {withCredentials: true,
                 headers: { "Content-Type": "application/json" }
                }
            );
            console.log("Appointment created successfully:", data);
            toast.success(data.message || "Appointment created successfully");
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
            setSelectedDoctorId('');
            setAvailableSlots([]);
            setSelectedTimeSlot('');
        } catch (error) {
            console.error("Error creating appointment:", error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to book appointment';
            const errorStatus = error.response?.status;
            
            console.error("Error details:", {
                status: errorStatus,
                message: errorMessage,
                data: error.response?.data,
                fullError: error
            });
            
            // Toujours afficher l'erreur avec un toast
            toast.error(errorMessage, {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
            });
            
            // Si l'erreur est 401 ou 403, rediriger vers la page de login
            if (errorStatus === 401 || errorStatus === 403) {
                toast.info('Please login to continue', {
                    position: "top-center",
                    autoClose: 3000,
                });
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
            value={selectedDoctorId || ''}
            onChange={(e) => {
              const doctorId = e.target.value;
              if (doctorId) {
                // Trouver le docteur sélectionné
                const selectedDoctor = doctors
                  .filter((doctor) => doctor.doctorDepartment === department)
                  .find((doctor) => doctor._id === doctorId);
                
                if (selectedDoctor) {
                  setSelectedDoctorId(selectedDoctor._id);
                  setDoctorFirstName(selectedDoctor.firstName || '');
                  setDoctorLastName(selectedDoctor.lastName || '');
                } else {
                  setSelectedDoctorId('');
                  setDoctorFirstName('');
                  setDoctorLastName('');
                }
              } else {
                setSelectedDoctorId('');
                setDoctorFirstName('');
                setDoctorLastName('');
              }
              
              // Réinitialiser les créneaux et la date
              setAvailableSlots([]);
              setSelectedTimeSlot('');
              setAppointmentDate('');
            }}
            disabled={!department || !clinicName}
            required
          >
            <option value=''>Select Doctor</option>
            {doctors
              .filter((doctor) => doctor.doctorDepartment === department)
              .map((doctor, index) => {
                const doctorFullName = `${doctor.firstName} ${doctor.lastName || ''}`.trim();
                return (
                  <option
                    value={doctor._id}
                    key={doctor._id || index}
                  >
                    {doctorFullName}
                  </option>
                );
              })}
          </select>
        </div>
        
        {/* Affichage des créneaux disponibles */}
        {selectedDoctorId && appointmentDate && (
          <div style={{ 
            marginTop: '20px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '2px solid #e0e0e0'
          }}>
            <label style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#333', 
              marginBottom: '15px', 
              display: 'block' 
            }}>
              Available Time Slots *
            </label>
            {loadingSlots ? (
              <p style={{ color: '#666' }}>Loading available slots...</p>
            ) : availableSlots.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                gap: '10px' 
              }}>
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => {
                      setSelectedTimeSlot(slot.time);
                      // Mettre à jour appointmentDate avec la date + heure
                      // Format: YYYY-MM-DD HH:MM
                      // Extraire seulement la date (sans l'heure si elle existe déjà)
                      let dateOnly = appointmentDate;
                      if (appointmentDate.includes('T')) {
                        dateOnly = appointmentDate.split('T')[0];
                      } else if (appointmentDate.includes(' ')) {
                        dateOnly = appointmentDate.split(' ')[0];
                      }
                      const dateTime = `${dateOnly} ${slot.time}`;
                      setAppointmentDate(dateTime);
                    }}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: selectedTimeSlot === slot.time ? '#4a90e2' : '#fff',
                      color: selectedTimeSlot === slot.time ? '#fff' : '#333',
                      border: `2px solid ${selectedTimeSlot === slot.time ? '#4a90e2' : '#ddd'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTimeSlot !== slot.time) {
                        e.target.style.backgroundColor = '#e8f4f8';
                        e.target.style.borderColor = '#4a90e2';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTimeSlot !== slot.time) {
                        e.target.style.backgroundColor = '#fff';
                        e.target.style.borderColor = '#ddd';
                      }
                    }}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ color: '#e74c3c', fontWeight: '500' }}>
                No available time slots for this date. Please select another date.
              </p>
            )}
            {selectedTimeSlot && (
              <p style={{ marginTop: '15px', color: '#27ae60', fontWeight: '600' }}>
                Selected time: {selectedTimeSlot}
              </p>
            )}
          </div>
        )}
        
        {/* Appointment Date - Juste avant Address */}
        <div>
          <input
            type={appointmentDate ? 'date' : 'text'}
            placeholder='Appointment Date'
            value={appointmentDate.split(' ')[0] || appointmentDate}
            onFocus={(e) => (e.target.type = 'date')}
            onBlur={(e) => {
              if (!e.target.value) {
                e.target.type = 'text';
              }
            }}
            onChange={async (e) => {
              const selectedDate = e.target.value;
              setAppointmentDate(selectedDate);
              setSelectedTimeSlot('');
              
              // Si un docteur est sélectionné et une date est choisie, récupérer les créneaux disponibles
              if (selectedDoctorId && selectedDate) {
                setLoadingSlots(true);
                try {
                  const { data } = await axios.get(
                    `http://localhost:4000/api/v1/schedule/available/${selectedDoctorId}?date=${selectedDate}`
                  );
                  setAvailableSlots(data.availableSlots || []);
                  if (data.availableSlots && data.availableSlots.length === 0) {
                    toast.info('No available time slots for this date');
                  }
                } catch (error) {
                  console.error('Error fetching available slots:', error);
                  setAvailableSlots([]);
                  if (error.response?.status !== 200) {
                    toast.error('Failed to fetch available time slots');
                  }
                } finally {
                  setLoadingSlots(false);
                }
              } else {
                setAvailableSlots([]);
              }
            }}
            disabled={!selectedDoctorId}
            min={new Date().toISOString().split('T')[0]}
            style={{ width: '100%' }}
          />
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