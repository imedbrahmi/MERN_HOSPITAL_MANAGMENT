import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const MedicalRecords = () => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [patients, setPatients] = useState([]);
  const { isAuthenticated, user } = useContext(Context);

  const [formData, setFormData] = useState({
    patientId: "",
    appointmentId: "",
    visitDate: new Date().toISOString().split("T")[0],
    diagnosis: "",
    symptoms: "",
    examination: "",
    treatment: "",
    notes: "",
    vitalSigns: {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      weight: "",
      height: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated && user?.role === "Doctor") {
      fetchMedicalRecords();
      fetchPatients();
    }
  }, [isAuthenticated, user]);

  const fetchMedicalRecords = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:4000/api/v1/medical-record/doctor/${user._id}`,
        { withCredentials: true }
      );
      setMedicalRecords(data.medicalRecords || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch medical records");
      setMedicalRecords([]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await axios.put(
          `http://localhost:4000/api/v1/medical-record/${editingRecord._id}`,
          formData,
          { withCredentials: true }
        );
        toast.success("Medical record updated successfully");
      } else {
        await axios.post(
          "http://localhost:4000/api/v1/medical-record/create",
          formData,
          { withCredentials: true }
        );
        toast.success("Medical record created successfully");
      }
      setShowForm(false);
      setEditingRecord(null);
      resetForm();
      fetchMedicalRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save medical record");
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      appointmentId: "",
      visitDate: new Date().toISOString().split("T")[0],
      diagnosis: "",
      symptoms: "",
      examination: "",
      treatment: "",
      notes: "",
      vitalSigns: {
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        weight: "",
        height: "",
      },
    });
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      patientId: record.patientId._id || record.patientId,
      appointmentId: record.appointmentId?._id || record.appointmentId || "",
      visitDate: new Date(record.visitDate).toISOString().split("T")[0],
      diagnosis: record.diagnosis,
      symptoms: record.symptoms || "",
      examination: record.examination || "",
      treatment: record.treatment || "",
      notes: record.notes || "",
      vitalSigns: record.vitalSigns || {
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        weight: "",
        height: "",
      },
    });
    setShowForm(true);
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  if (user?.role !== "Doctor") {
    return <Navigate to={"/"} />;
  }

  return (
    <section className="page medical-records">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>MEDICAL RECORDS</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingRecord(null);
            resetForm();
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4a90e2",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "Add Medical Record"}
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
          <h3>{editingRecord ? "Edit Medical Record" : "Add New Medical Record"}</h3>
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

            <input
              type="date"
              value={formData.visitDate}
              onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
              required
            />

            <textarea
              placeholder="Diagnosis *"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              required
              rows="3"
            />

            <textarea
              placeholder="Symptoms"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              rows="3"
            />

            <textarea
              placeholder="Examination"
              value={formData.examination}
              onChange={(e) => setFormData({ ...formData, examination: e.target.value })}
              rows="3"
            />

            <textarea
              placeholder="Treatment"
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              rows="3"
            />

            <input
              type="text"
              placeholder="Blood Pressure (e.g., 120/80)"
              value={formData.vitalSigns.bloodPressure}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vitalSigns: { ...formData.vitalSigns, bloodPressure: e.target.value },
                })
              }
            />

            <input
              type="number"
              placeholder="Heart Rate (BPM)"
              value={formData.vitalSigns.heartRate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vitalSigns: { ...formData.vitalSigns, heartRate: e.target.value },
                })
              }
            />

            <input
              type="number"
              placeholder="Temperature (°C)"
              value={formData.vitalSigns.temperature}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vitalSigns: { ...formData.vitalSigns, temperature: e.target.value },
                })
              }
            />

            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
            />

            <button type="submit">{editingRecord ? "Update" : "Create"}</button>
          </form>
        </div>
      )}

      <div className="banner" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {medicalRecords.length > 0 ? (
          medicalRecords.map((record) => (
            <div
              key={record._id}
              className="card"
              style={{
                backgroundColor: "#ffffff",
                padding: "30px",
                borderRadius: "15px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, marginBottom: "15px" }}>
                    {record.patientId?.firstName} {record.patientId?.lastName || ""}
                  </h4>
                  <p style={{ margin: "5px 0" }}>
                    <strong>Visit Date:</strong> {new Date(record.visitDate).toLocaleDateString()}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <strong>Diagnosis:</strong> {record.diagnosis}
                  </p>
                  {record.symptoms && (
                    <p style={{ margin: "5px 0" }}>
                      <strong>Symptoms:</strong> {record.symptoms}
                    </p>
                  )}
                  {record.treatment && (
                    <p style={{ margin: "5px 0" }}>
                      <strong>Treatment:</strong> {record.treatment}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleEdit(record)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#4a90e2",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        ) : (
          <h3>No medical records found.</h3>
        )}
      </div>
    </section>
  );
};

export default MedicalRecords;

