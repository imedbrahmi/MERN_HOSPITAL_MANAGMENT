import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

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
        `http://localhost:4000/api/v1/prescription/doctor/${user._id}`,
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
        "http://localhost:4000/api/v1/user/patients",
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
        "http://localhost:4000/api/v1/prescription/create",
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
            padding: "30px",
            borderRadius: "15px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            marginBottom: "30px",
          }}
        >
          <h3>Create New Prescription</h3>
          <form onSubmit={handleSubmit} className="add-admin-form">
            <select
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
            >
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName || ""} - {patient.email}
                </option>
              ))}
            </select>

            <h4>Medications</h4>
            {formData.medications.map((med, index) => (
              <div key={index} style={{ border: "1px solid #ddd", padding: "15px", marginBottom: "15px", borderRadius: "5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong>Medication {index + 1}</strong>
                  {formData.medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(index)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#e74c3c",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Medication Name *"
                  value={med.name}
                  onChange={(e) => handleMedicationChange(index, "name", e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g., 500mg) *"
                  value={med.dosage}
                  onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Frequency (e.g., 3 times a day) *"
                  value={med.frequency}
                  onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Duration (e.g., 7 days) *"
                  value={med.duration}
                  onChange={(e) => handleMedicationChange(index, "duration", e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Instructions (optional)"
                  value={med.instructions}
                  onChange={(e) => handleMedicationChange(index, "instructions", e.target.value)}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddMedication}
              style={{
                padding: "10px 20px",
                backgroundColor: "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginBottom: "15px",
              }}
            >
              Add Another Medication
            </button>

            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
            />

            <button type="submit">Create Prescription</button>
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

