import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const { isAuthenticated } = useContext(Context);
  
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/user/patients",
          { withCredentials: true }
        );
        setPatients(data.patients || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch patients");
        setPatients([]);
      }
    };
    fetchPatients();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }
  
  return (
    <section className="page patients">
      <h1>PATIENTS</h1>
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

