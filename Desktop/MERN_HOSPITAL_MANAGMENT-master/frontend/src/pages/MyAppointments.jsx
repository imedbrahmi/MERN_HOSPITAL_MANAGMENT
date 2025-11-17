import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Hero from "../components/Hero";
import { API_BASE_URL } from '../utils/api';

const MyAppointments = () => {
  const { isAuthenticated, user } = useContext(Context);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    console.log("MyAppointments - isAuthenticated:", isAuthenticated, "user:", user, "user.role:", user?.role);
    if (isAuthenticated && user && user.role === "Patient") {
      console.log("Fetching appointments for patient:", user._id);
      fetchAppointments();
    } else {
      console.log("Not authenticated or not a patient - isAuthenticated:", isAuthenticated, "user:", user);
    }
  }, [isAuthenticated, user]);

  const fetchAppointments = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/appointment/patient/my-appointments`,
        { withCredentials: true }
      );
      console.log("Appointments data:", data);
      setAppointments(data.appointments || []);
      if (!data.appointments || data.appointments.length === 0) {
        console.log("No appointments found for this patient");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error(error.response?.data?.message || "Failed to fetch appointments");
      setAppointments([]);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/appointment/${appointmentId}`,
        { withCredentials: true }
      );
      toast.success("Appointment cancelled successfully");
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel appointment");
    }
  };

  if (!isAuthenticated || user?.role !== "Patient") {
    return <Navigate to={"/login"} />;
  }

  return (
    <>
      <Hero title={"My Appointments | MedFlow"} imageUrl={"/signin.png"} />
      <div className="container form-component">
        <h2>My Appointments</h2>
        {appointments.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "30px" }}>
            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                style={{
                  backgroundColor: "#ffffff",
                  padding: "25px",
                  borderRadius: "15px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, marginBottom: "15px" }}>
                      Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName || ""}
                    </h4>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Date:</strong> {appointment.appointment_date}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Department:</strong> {appointment.department}
                    </p>
                    {appointment.clinicId && (
                      <p style={{ margin: "5px 0" }}>
                        <strong>Clinic:</strong> {appointment.clinicId.name || appointment.clinicId}
                      </p>
                    )}
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
                  {appointment.status === "Pending" && (
                    <button
                      onClick={() => handleCancel(appointment._id)}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#e74c3c",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginTop: "30px", textAlign: "center" }}>No appointments found.</p>
        )}
      </div>
    </>
  );
};

export default MyAppointments;

