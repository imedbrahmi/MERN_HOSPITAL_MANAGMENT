import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Hero from "../components/Hero";

const MyPrescriptions = () => {
  const { isAuthenticated, user } = useContext(Context);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "Patient") {
      fetchPrescriptions();
    }
  }, [isAuthenticated, user]);

  const fetchPrescriptions = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:4000/api/v1/prescription/patient/${user._id}`,
        { withCredentials: true }
      );
      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch prescriptions");
      setPrescriptions([]);
    }
  };

  if (!isAuthenticated || user?.role !== "Patient") {
    return <Navigate to={"/login"} />;
  }

  return (
    <>
      <Hero title={"My Prescriptions | MedFlow"} imageUrl={"/signin.png"} />
      <div className="container form-component">
        <h2>My Prescriptions</h2>
        {prescriptions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "30px" }}>
            {prescriptions.map((prescription) => (
              <div
                key={prescription._id}
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
                      Dr. {prescription.doctorId?.firstName} {prescription.doctorId?.lastName || ""}
                    </h4>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Date:</strong> {new Date(prescription.prescriptionDate).toLocaleDateString()}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Medications:</strong> {prescription.medications.length}
                    </p>
                    <div style={{ marginTop: "15px" }}>
                      <strong>Medications:</strong>
                      <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
                        {prescription.medications.map((med, index) => (
                          <li key={index} style={{ marginBottom: "5px" }}>
                            {med.name} - {med.dosage} - {med.frequency} - {med.duration}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await axios.get(
                          `http://localhost:4000/api/v1/prescription/${prescription._id}/pdf`,
                          { 
                            withCredentials: true,
                            responseType: 'blob'
                          }
                        );
                        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `prescription-${prescription._id}.pdf`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        toast.error(error.response?.data?.message || "Failed to download PDF");
                      }
                    }}
                    style={{
                      display: "inline-block",
                      padding: "10px 20px",
                      backgroundColor: "#4a90e2",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginTop: "30px", textAlign: "center" }}>No prescriptions found.</p>
        )}
      </div>
    </>
  );
};

export default MyPrescriptions;

