import React, { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../main";
import axios from "axios";
import { API_BASE_URL } from '../utils/api';

const PatientDetails = () => {
  const { isAuthenticated, user } = useContext(Context);
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPatientDetails();
      fetchPatientAppointments();
    }
  }, [isAuthenticated, id]);

  const fetchPatientDetails = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/user/patient/${id}`,
        { withCredentials: true }
      );
      setPatient(data.patient);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch patient details");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientAppointments = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/appointment/getAll`,
        { withCredentials: true }
      );
      // Filtrer les appointments pour ce patient
      // Si c'est un Doctor, le backend retourne déjà uniquement ses appointments
      // On filtre donc uniquement par patientId
      const patientAppointments = data.appointments.filter(
        apt => apt.patientId?._id === id || apt.patientId === id
      );
      setAppointments(patientAppointments);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  if (loading) {
    return (
      <section className="page patient-details">
        <h1>Loading...</h1>
      </section>
    );
  }

  if (!patient) {
    return (
      <section className="page patient-details">
        <h1>Patient not found</h1>
        <button onClick={() => navigate("/patients")}>Back to Patients</button>
      </section>
    );
  }

  return (
    <section className="page patient-details">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>PATIENT DETAILS</h1>
        <button
          onClick={() => navigate("/patients")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Back to Patients
        </button>
      </div>

      <div
        className="card"
        style={{
          backgroundColor: "#ffffff",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ marginBottom: "25px", color: "#333" }}>
          {patient.firstName} {patient.lastName || ""}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          <div>
            <p style={{ margin: "10px 0" }}>
              <strong>Email:</strong> {patient.email}
            </p>
            <p style={{ margin: "10px 0" }}>
              <strong>Phone:</strong> {patient.phone}
            </p>
            <p style={{ margin: "10px 0" }}>
              <strong>CIN:</strong> {patient.CIN}
            </p>
          </div>
          <div>
            <p style={{ margin: "10px 0" }}>
              <strong>Date of Birth:</strong>{" "}
              {new Date(patient.dob).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p style={{ margin: "10px 0" }}>
              <strong>Gender:</strong> {patient.gender}
            </p>
            <p style={{ margin: "10px 0" }}>
              <strong>Registered:</strong>{" "}
              {new Date(patient.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {/* Edit button - Uniquement pour Admin, SuperAdmin, Receptionist (pas pour Doctor) */}
        {(user?.role === "Admin" || user?.role === "SuperAdmin" || user?.role === "Receptionist") && (
          <div style={{ marginTop: "30px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate(`/patient/edit/${id}`)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Edit Patient
            </button>
          </div>
        )}
      </div>

      <div
        className="card"
        style={{
          backgroundColor: "#ffffff",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2 style={{ marginBottom: "25px", color: "#333" }}>Appointment History</h2>
        {appointments.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                style={{
                  padding: "20px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <p style={{ margin: "5px 0" }}>
                  <strong>Date:</strong> {appointment.appointment_date}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Department:</strong> {appointment.department}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Doctor:</strong>{" "}
                  {appointment.doctorId?.firstName} {appointment.doctorId?.lastName || ""}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      color:
                        appointment.status === "Accepted"
                          ? "green"
                          : appointment.status === "Rejected"
                          ? "red"
                          : "orange",
                    }}
                  >
                    {appointment.status}
                  </span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No appointments found for this patient.</p>
        )}
      </div>
    </section>
  );
};

export default PatientDetails;

