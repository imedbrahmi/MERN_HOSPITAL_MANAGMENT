import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Context } from '../main';
import { Navigate } from 'react-router-dom';

const CreateAppointment = () => {
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
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [useExistingPatient, setUseExistingPatient] = useState(false);
    
    // Récupérer la liste des cliniques au chargement
    useEffect(() => {
        const fetchClinics = async () => {
            try {
                const { data } = await axios.get('http://localhost:4000/api/v1/clinics', {
                    withCredentials: true
                });
                setClinics(data.clinics || []);
                
                // Si l'utilisateur est Admin/Receptionist, utiliser sa clinique par défaut
                if (user?.clinicId && data.clinics) {
                    const userClinic = data.clinics.find(c => c._id === user.clinicId);
                    if (userClinic) {
                        setClinicName(userClinic.name);
                    }
                }
            } catch (error) {
                console.error('Error fetching clinics:', error);
            }
        };
        fetchClinics();
    }, [user]);

    // Récupérer les patients pour la sélection
    useEffect(() => {
        const fetchPatients = async () => {
            if (!clinicName) return;
            try {
                const { data } = await axios.get(
                    'http://localhost:4000/api/v1/user/patients',
                    { withCredentials: true }
                );
                setPatients(data.patients || []);
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        };
        fetchPatients();
    }, [clinicName]);

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
                    `http://localhost:4000/api/v1/user/doctors/clinic/${encodeURIComponent(clinicName)}`,
                    { withCredentials: true }
                );
                const clinicDoctors = data.doctors || [];
                setDoctors(clinicDoctors);
                
                const uniqueDepartments = [...new Set(clinicDoctors.map(doctor => doctor.doctorDepartment).filter(Boolean))];
                setAvailableDepartments(uniqueDepartments);
                
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

    // Charger les informations du patient sélectionné
    useEffect(() => {
        if (useExistingPatient && selectedPatientId) {
            const patient = patients.find(p => p._id === selectedPatientId);
            if (patient) {
                setFirstName(patient.firstName || '');
                setLastName(patient.lastName || '');
                setPhone(patient.phone || '');
                setCIN(patient.CIN || '');
                setEmail(patient.email || '');
                setDob(patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : '');
                setGender(patient.gender || '');
            }
        }
    }, [selectedPatientId, useExistingPatient, patients]);

    const handleAppointment = async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            toast.error('Please login first');
            navigate('/login');
            return;
        }
        
        try {
            // Vérifier qu'un créneau horaire a été sélectionné
            if (!selectedTimeSlot) {
                toast.error('Please select an available time slot');
                return;
            }
            
            const dateOnly = appointmentDate.split('T')[0] || appointmentDate.split(' ')[0];
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
                doctor_lastName: doctorLastName || "",
                hasVisited: Boolean(hasVisited),
                address,
                clinicName,
                ...(useExistingPatient && selectedPatientId ? { patientId: selectedPatientId } : {})
            };
            
            console.log("Sending appointment data:", appointmentData);
            
            const { data } = await axios.post(
                'http://localhost:4000/api/v1/appointment/post',
                appointmentData,
                {
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" }
                }
            );
            toast.success(data.message);
            
            // Réinitialiser le formulaire
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
            setSelectedDoctorId('');
            setAvailableSlots([]);
            setSelectedTimeSlot('');
            setSelectedPatientId('');
            setUseExistingPatient(false);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to book appointment';
            toast.error(errorMessage);
        }
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (user?.role !== "Admin" && user?.role !== "Receptionist") {
        return <Navigate to="/" />;
    }

    // Styles réutilisables pour les champs
    const inputStyle = {
        padding: '15px 20px',
        fontSize: '16px',
        border: '2px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#fff',
        color: '#333',
        width: '100%',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    };

    const labelStyle = {
        fontSize: '15px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '8px',
        display: 'block'
    };

    const selectStyle = {
        ...inputStyle,
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 15px center',
        paddingRight: '40px'
    };

    const fieldContainerStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '20px'
    };

    const rowStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px'
    };

    return (
        <section className="page create-appointment" style={{ padding: '30px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#333', marginBottom: '10px', textAlign: 'center' }}>
                    CREATE APPOINTMENT
                </h1>
                <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', textAlign: 'center' }}>
                    Create an appointment for a patient. All available time slots will be respected.
                </p>
                
                <form onSubmit={handleAppointment} style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    {/* Option pour utiliser un patient existant */}
                    <div style={{ 
                        marginBottom: '30px', 
                        padding: '20px', 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: '10px',
                        border: '2px solid #e0e0e0'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '15px' }}>
                            <input
                                type="checkbox"
                                checked={useExistingPatient}
                                onChange={(e) => {
                                    setUseExistingPatient(e.target.checked);
                                    if (!e.target.checked) {
                                        setSelectedPatientId('');
                                    }
                                }}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: '600', fontSize: '16px', color: '#333' }}>Use existing patient</span>
                        </label>
                        
                        {useExistingPatient && (
                            <div style={fieldContainerStyle}>
                                <label style={labelStyle}>Select Patient *</label>
                                <select
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                    style={selectStyle}
                                >
                                    <option value="">Select Patient</option>
                                    {patients.map((patient) => (
                                        <option key={patient._id} value={patient._id}>
                                            {patient.firstName} {patient.lastName || ''} - {patient.email} - CIN: {patient.CIN}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Patient Information */}
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '20px', borderBottom: '2px solid #4a90e2', paddingBottom: '10px' }}>
                        Patient Information
                    </h3>

                    <div style={rowStyle}>
                        <div style={fieldContainerStyle}>
                            <label style={labelStyle}>First Name *</label>
                            <input
                                type='text'
                                placeholder='Enter first name'
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                disabled={useExistingPatient && selectedPatientId}
                                required
                                style={inputStyle}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#4a90e2';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#ddd';
                                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                }}
                            />
                        </div>
                        <div style={fieldContainerStyle}>
                            <label style={labelStyle}>Last Name</label>
                            <input
                                type='text'
                                placeholder='Enter last name'
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                disabled={useExistingPatient && selectedPatientId}
                                style={inputStyle}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#4a90e2';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#ddd';
                                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                }}
                            />
                        </div>
                    </div>

                    <div style={rowStyle}>
                        <div style={fieldContainerStyle}>
                            <label style={labelStyle}>Email *</label>
                            <input
                                type='email'
                                placeholder='Enter email address'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={useExistingPatient && selectedPatientId}
                                required
                                style={inputStyle}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#4a90e2';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#ddd';
                                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                }}
                            />
                        </div>
                        <div style={fieldContainerStyle}>
                            <label style={labelStyle}>Phone *</label>
                            <input
                                type='tel'
                                placeholder='Enter phone number'
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={useExistingPatient && selectedPatientId}
                                required
                                style={inputStyle}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#4a90e2';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#ddd';
                                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                }}
                            />
                        </div>
                    </div>

                    <div style={rowStyle}>
                        <div style={fieldContainerStyle}>
                            <label style={labelStyle}>CIN *</label>
                            <input
                                type='text'
                                placeholder='Enter CIN number'
                                value={CIN}
                                onChange={(e) => setCIN(e.target.value)}
                                disabled={useExistingPatient && selectedPatientId}
                                required
                                style={inputStyle}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#4a90e2';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#ddd';
                                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                }}
                            />
                        </div>
                        <div style={fieldContainerStyle}>
                            <label style={labelStyle}>Date of Birth *</label>
                            <input
                                type={dob ? 'date' : 'text'}
                                placeholder='Select date of birth'
                                value={dob}
                                onFocus={(e) => {
                                    e.target.type = 'date';
                                    e.target.style.borderColor = '#4a90e2';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                                }}
                                onBlur={(e) => {
                                    if (!e.target.value) {
                                        e.target.type = 'text';
                                    }
                                    e.target.style.borderColor = '#ddd';
                                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                }}
                                onChange={(e) => setDob(e.target.value)}
                                disabled={useExistingPatient && selectedPatientId}
                                required
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div style={{ ...fieldContainerStyle, marginBottom: '30px' }}>
                        <label style={labelStyle}>Gender *</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            disabled={useExistingPatient && selectedPatientId}
                            required
                            style={selectStyle}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#4a90e2';
                                e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#ddd';
                                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                            }}
                        >
                            <option value='' disabled>Select Gender *</option>
                            <option value='Male'>Male</option>
                            <option value='Female'>Female</option>
                        </select>
                    </div>

                    {/* Appointment Details */}
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '20px', marginTop: '30px', borderBottom: '2px solid #4a90e2', paddingBottom: '10px' }}>
                        Appointment Details
                    </h3>

                    <div style={rowStyle}>
                        <div style={fieldContainerStyle}>
                            <label style={labelStyle}>Clinic *</label>
                            <select 
                                value={clinicName} 
                                onChange={(e) => setClinicName(e.target.value)}
                                required
                                disabled={user?.clinicId && clinics.find(c => c._id === user.clinicId)?.name === clinicName}
                                style={selectStyle}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#4a90e2';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#ddd';
                                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                }}
                            >
                                <option value='' disabled>Select Clinic *</option>
                                {clinics.map((clinic, index) => (
                                    <option value={clinic.name} key={clinic._id || index}>
                                        {clinic.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={fieldContainerStyle}>
                            <label style={labelStyle}>Department *</label>
                            <select
                                value={department}
                                onChange={(e) => {
                                    const selectedDepartment = e.target.value;
                                    setDepartment(selectedDepartment);
                                    setDoctorFirstName('');
                                    setDoctorLastName('');
                                    setSelectedDoctorId('');
                                }}
                                disabled={!clinicName || availableDepartments.length === 0}
                                required
                                style={selectStyle}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#4a90e2';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#ddd';
                                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                }}
                            >
                                <option value='' disabled>
                                    {!clinicName ? 'Select Clinic First' : availableDepartments.length === 0 ? 'No Departments Available' : 'Select Department *'}
                                </option>
                                {availableDepartments.map((depart, index) => (
                                    <option value={depart} key={index}>
                                        {depart}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ ...fieldContainerStyle, marginBottom: '30px' }}>
                        <label style={labelStyle}>Doctor *</label>
                        <select
                            value={selectedDoctorId || ''}
                            onChange={(e) => {
                                const doctorId = e.target.value;
                                if (doctorId) {
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
                                
                                setAvailableSlots([]);
                                setSelectedTimeSlot('');
                                setAppointmentDate('');
                            }}
                            disabled={!department || !clinicName}
                            required
                            style={selectStyle}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#4a90e2';
                                e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#ddd';
                                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                            }}
                        >
                            <option value=''>Select Doctor *</option>
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
                                                const dateOnly = appointmentDate.split('T')[0] || appointmentDate.split(' ')[0];
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
                    <div style={{ ...fieldContainerStyle, marginBottom: '30px' }}>
                        <label style={labelStyle}>Appointment Date *</label>
                        <input
                            type={appointmentDate ? 'date' : 'text'}
                            placeholder='Select appointment date'
                            value={appointmentDate.split(' ')[0] || appointmentDate}
                            onFocus={(e) => {
                                e.target.type = 'date';
                                e.target.style.borderColor = '#4a90e2';
                                e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                            }}
                            onBlur={(e) => {
                                if (!e.target.value) {
                                    e.target.type = 'text';
                                }
                                e.target.style.borderColor = '#ddd';
                                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                            }}
                            onChange={async (e) => {
                                const selectedDate = e.target.value;
                                setAppointmentDate(selectedDate);
                                setSelectedTimeSlot('');
                                
                                if (selectedDoctorId && selectedDate) {
                                    setLoadingSlots(true);
                                    try {
                                        const { data } = await axios.get(
                                            `http://localhost:4000/api/v1/schedule/available/${selectedDoctorId}?date=${selectedDate}`,
                                            { withCredentials: true }
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
                            style={inputStyle}
                            required
                        />
                    </div>
                    
                    <div style={{ ...fieldContainerStyle, marginBottom: '30px' }}>
                        <label style={labelStyle}>Address *</label>
                        <textarea
                            rows='4'
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder='Enter patient address'
                            required
                            style={{
                                ...inputStyle,
                                resize: 'vertical',
                                minHeight: '100px',
                                fontFamily: 'inherit'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#4a90e2';
                                e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#ddd';
                                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                            }}
                        />
                    </div>
                    
                    <div style={{
                        gap: '10px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: '30px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                            <input
                                type="checkbox"
                                checked={hasVisited}
                                onChange={(e) => setHasVisited(e.target.checked)}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                                Have you visited before?
                            </span>
                        </label>
                    </div>
                    
                    <div style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', marginTop: '30px' }}>
                        <button 
                            type='submit'
                            style={{
                                padding: '15px 40px',
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#fff',
                                backgroundColor: '#4a90e2',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 6px rgba(74, 144, 226, 0.3)',
                                minWidth: '200px'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#357abd';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 12px rgba(74, 144, 226, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#4a90e2';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 6px rgba(74, 144, 226, 0.3)';
                            }}
                        >
                            Create Appointment
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default CreateAppointment;

