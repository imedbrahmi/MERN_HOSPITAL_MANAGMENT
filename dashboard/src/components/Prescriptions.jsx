import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import { API_BASE_URL } from '../utils/api';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState([]);
  const { isAuthenticated, user } = useContext(Context);

  const [formData, setFormData] = useState({
    patientId: "",
    medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
    notes: "",
  });

  useEffect(() => {
    if (isAuthenticated && user?.role === "Doctor") {
      fetchPrescriptions();
      fetchPatients();
    }
  }, [isAuthenticated, user]);

  const fetchPrescriptions = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/prescription/doctor/${user._id}`,
        { withCredentials: true }
      );
      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch prescriptions");
      setPrescriptions([]);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/user/patients`,
        { withCredentials: true }
      );
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    }
  };

  const handleAddMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
    });
  };

  const handleRemoveMedication = (index) => {
    const newMedications = formData.medications.filter((_, i) => i !== index);
    setFormData({ ...formData, medications: newMedications });
  };

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...formData.medications];
    newMedications[index][field] = value;
    setFormData({ ...formData, medications: newMedications });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE_URL}/prescription/create`,
        formData,
        { withCredentials: true }
      );
      toast.success("Prescription created successfully");
      setShowForm(false);
      setFormData({
        patientId: "",
        medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
        notes: "",
      });
      fetchPrescriptions();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create prescription");
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  if (user?.role !== "Doctor") {
    return <Navigate to={"/"} />;
  }

  return (
    <section className="page prescriptions">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>PRESCRIPTIONS</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4a90e2",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "Create Prescription"}
        </button>
      </div>

      {showForm && (
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
          <h3 style={{ fontSize: "28px", marginBottom: "30px", color: "#333", fontWeight: "600" }}>Create New Prescription</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "16px", fontWeight: "600", color: "#333" }}>Patient *</label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                style={{
                  padding: "15px 20px",
                  fontSize: "16px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  color: "#333",
                  cursor: "pointer",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#4a90e2"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              >
                <option value="">Select Patient</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName || ""} - {patient.email}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: "20px" }}>
              <h4 style={{ fontSize: "20px", marginBottom: "20px", color: "#333", fontWeight: "600" }}>Medications</h4>
              {formData.medications.map((med, index) => (
                <div 
                  key={index} 
                  style={{ 
                    border: "2px solid #e0e0e0", 
                    padding: "25px", 
                    marginBottom: "20px", 
                    borderRadius: "10px",
                    backgroundColor: "#fafafa"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <strong style={{ fontSize: "18px", color: "#333" }}>Medication {index + 1}</strong>
                    {formData.medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#e74c3c",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                          transition: "background-color 0.3s",
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#c0392b"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "#e74c3c"}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Medication Name *</label>
                      <input
                        type="text"
                        placeholder="Enter medication name"
                        value={med.name}
                        onChange={(e) => handleMedicationChange(index, "name", e.target.value)}
                        required
                        style={{
                          padding: "15px 20px",
                          fontSize: "16px",
                          border: "2px solid #ddd",
                          borderRadius: "8px",
                          backgroundColor: "#fff",
                          color: "#333",
                          transition: "border-color 0.3s",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#4a90e2"}
                        onBlur={(e) => e.target.style.borderColor = "#ddd"}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Dosage *</label>
                        <input
                          type="text"
                          placeholder="e.g., 500mg"
                          value={med.dosage}
                          onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                          required
                          style={{
                            padding: "15px 20px",
                            fontSize: "16px",
                            border: "2px solid #ddd",
                            borderRadius: "8px",
                            backgroundColor: "#fff",
                            color: "#333",
                            transition: "border-color 0.3s",
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#4a90e2"}
                          onBlur={(e) => e.target.style.borderColor = "#ddd"}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Frequency *</label>
                        <input
                          type="text"
                          placeholder="e.g., 3 times a day"
                          value={med.frequency}
                          onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)}
                          required
                          style={{
                            padding: "15px 20px",
                            fontSize: "16px",
                            border: "2px solid #ddd",
                            borderRadius: "8px",
                            backgroundColor: "#fff",
                            color: "#333",
                            transition: "border-color 0.3s",
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#4a90e2"}
                          onBlur={(e) => e.target.style.borderColor = "#ddd"}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Duration *</label>
                        <input
                          type="text"
                          placeholder="e.g., 7 days"
                          value={med.duration}
                          onChange={(e) => handleMedicationChange(index, "duration", e.target.value)}
                          required
                          style={{
                            padding: "15px 20px",
                            fontSize: "16px",
                            border: "2px solid #ddd",
                            borderRadius: "8px",
                            backgroundColor: "#fff",
                            color: "#333",
                            transition: "border-color 0.3s",
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#4a90e2"}
                          onBlur={(e) => e.target.style.borderColor = "#ddd"}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Instructions (optional)</label>
                        <input
                          type="text"
                          placeholder="Additional instructions"
                          value={med.instructions}
                          onChange={(e) => handleMedicationChange(index, "instructions", e.target.value)}
                          style={{
                            padding: "15px 20px",
                            fontSize: "16px",
                            border: "2px solid #ddd",
                            borderRadius: "8px",
                            backgroundColor: "#fff",
                            color: "#333",
                            transition: "border-color 0.3s",
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#4a90e2"}
                          onBlur={(e) => e.target.style.borderColor = "#ddd"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddMedication}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#27ae60",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "500",
                  marginTop: "10px",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#229954"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#27ae60"}
              >
                + Add Another Medication
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Notes (optional)</label>
              <textarea
                placeholder="Add any additional notes or comments..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="4"
                style={{
                  padding: "15px 20px",
                  fontSize: "16px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  color: "#333",
                  fontFamily: "inherit",
                  resize: "vertical",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#4a90e2"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
            </div>

            <button 
              type="submit"
              style={{
                padding: "16px 32px",
                backgroundColor: "#4a90e2",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: "600",
                marginTop: "10px",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#357abd"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#4a90e2"}
            >
              Create Prescription
            </button>
          </form>
        </div>
      )}

      <div className="banner" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {prescriptions.length > 0 ? (
          prescriptions.map((prescription) => (
            <div
              key={prescription._id}
              className="card"
              style={{
                backgroundColor: "#ffffff",
                padding: "30px",
                borderRadius: "15px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h4 style={{ margin: 0, marginBottom: "15px" }}>
                {prescription.patientId?.firstName} {prescription.patientId?.lastName || ""}
              </h4>
              <p style={{ margin: "5px 0" }}>
                <strong>Date:</strong> {new Date(prescription.prescriptionDate).toLocaleDateString()}
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>Medications:</strong> {prescription.medications.length}
              </p>
              <button
                onClick={async () => {
                  try {
                    const response = await axios.get(
                      `${API_BASE_URL}/prescription/${prescription._id}/pdf`,
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
                  marginTop: "10px",
                  padding: "8px 16px",
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
          ))
        ) : (
          <h3>No prescriptions found.</h3>
        )}
      </div>
    </section>
  );
};

export default Prescriptions;

