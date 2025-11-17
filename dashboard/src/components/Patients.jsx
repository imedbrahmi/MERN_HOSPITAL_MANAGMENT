import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate, useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../utils/api';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { isAuthenticated, user } = useContext(Context);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchPatients();
  }, [searchTerm]);

  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      
      const { data } = await axios.get(
        `${API_BASE_URL}/user/patients?${params.toString()}`,
        { withCredentials: true }
      );
      setPatients(data.patients || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch patients");
      setPatients([]);
    }
  };

  const handleDelete = async (patientId) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/user/patient/${patientId}`,
        { withCredentials: true }
      );
      toast.success("Patient deleted successfully");
      fetchPatients();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete patient");
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }
  
  return (
    <section className="page patients">
      <h1>PATIENTS</h1>
      
      {/* Barre de recherche */}
      <div style={{ marginBottom: "30px" }}>
        <input
          type="text"
          placeholder="Search by name, email, phone, or CIN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "12px 20px",
            fontSize: "16px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#fff",
          }}
        />
      </div>

      <div className="banner" style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        {patients && patients.length > 0 ? (
          patients.map((patient) => {
            return (
              <div 
                className="card" 
                key={patient._id}
                style={{
                  backgroundColor: "#ffffff",
                  padding: "30px",
                  borderRadius: "15px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  marginBottom: "20px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: "24px", color: "#333", marginBottom: "20px" }}>
                      {`${patient.firstName} ${patient.lastName || ""}`}
                    </h4>
                    <div className="details">
                      <p>
                        <strong>Email:</strong> <span>{patient.email}</span>
                      </p>
                      <p>
                        <strong>Phone:</strong> <span>{patient.phone}</span>
                      </p>
                      {patient.dob && (
                        <p>
                          <strong>Date of Birth:</strong> <span>
                            {new Date(patient.dob).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </p>
                      )}
                      {patient.CIN && (
                        <p>
                          <strong>CIN:</strong> <span>{patient.CIN}</span>
                        </p>
                      )}
                      {patient.gender && (
                        <p>
                          <strong>Gender:</strong> <span>{patient.gender}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* View Details - Disponible pour tous les rôles autorisés */}
                    {(user?.role === "Admin" || user?.role === "SuperAdmin" || user?.role === "Receptionist" || user?.role === "Doctor") && (
                      <button
                        onClick={() => navigate(`/patient/details/${patient._id}`)}
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#4a90e2",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        View Details
                      </button>
                    )}
                    {/* Edit et Delete - Uniquement pour Admin, SuperAdmin, Receptionist */}
                    {(user?.role === "Admin" || user?.role === "SuperAdmin" || user?.role === "Receptionist") && (
                      <>
                        <button
                          onClick={() => navigate(`/patient/edit/${patient._id}`)}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#27ae60",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(patient._id)}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#e74c3c",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <h1>No Registered Patients Found!</h1>
        )}
      </div>
    </section>
  );
};

export default Patients;

