import React from 'react'
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';



const AppointmentForm = () => {
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

    const departmentsArray  = ["Radiology", "Cardiology", "Dermatology",
                                "Gastroenterology","Oncology",
                                "Neurology", "Pediatry", 
                                "Psychiatry", "Urology", "ENT"];
    
    const [doctors, setDoctors] = useState([]);
     useEffect(() => {
        const fetchDoctors = async () => {
            const {data} = await axios.get('http://localhost:4000/api/v1/user/doctors',
            {withCredentials: true}   
        );
        setDoctors(data.doctors);
        }
        fetchDoctors();
     }, []);

    const handleAppointment = async (e) => {
        e.preventDefault();
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
                    address },
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
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to book appointment');

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
            value={department}
            onChange={(e) => {
              const selectedDepartment = e.target.value;
              setDepartment(selectedDepartment);
              const selectedDoctor = doctors.find(
                (doctor) => doctor.doctorDepartment === selectedDepartment
              );
              if (selectedDoctor) {
                setDoctorFirstName(selectedDoctor.firstName);
                setDoctorLastName(selectedDoctor.lastName);
              }
            }}
          >
            <option value='' disabled>
              Select Department
            </option>
            {departmentsArray.map((depart, index) => (
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
            disabled={!department}
          >
            <option value=''>Select Doctor</option>
            {doctors
              .filter((doctor) => doctor.doctorDepartment === department)
              .map((doctor, index) => (
                <option
                  value={`${doctor.firstName} ${doctor.lastName}`}
                  key={index}
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