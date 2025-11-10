import React from 'react'
import Hero from '../components/Hero'
import AppointmentForm from '../components/AppointmentForm'

const Appointment =() => {
  return (
    <>
    <Hero title={"Book an Appointment | MedFlow Institute of Health"} imageUrl={"/signin.png"}/>
    <AppointmentForm/>
    </>
  );
};

export default Appointment