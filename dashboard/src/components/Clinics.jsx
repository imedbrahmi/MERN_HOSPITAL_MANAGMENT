import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import { API_BASE_URL } from '../utils/api';

const Clinics = () => {
  const [clinics, setClinics] = useState([]);
  const { isAuthenticated } = useContext(Context);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/clinics/all`,
          { withCredentials: true }
        );
        setClinics(data.clinics || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch clinics");
      }
    };
    fetchClinics();
  }, []);

  const handleDelete = async (clinicId) => {
    if (!window.confirm("Are you sure you want to delete this clinic?")) {
      return;
    }

    try {
      const { data } = await axios.delete(
        `${API_BASE_URL}/clinics/${clinicId}`,
        { withCredentials: true }
      );
      toast.success(data.message);
      // Rafraîchir la liste
      const { data: updatedData } = await axios.get(
        `${API_BASE_URL}/clinics/all`,
        { withCredentials: true }
      );
      setClinics(updatedData.clinics || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete clinic");
    }
  };

  const handleEdit = (clinicId) => {
    navigate(`/clinics/edit/${clinicId}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  const handleOnboard = () => {
    navigate("/clinics/onboard");
  };

  return (
    <section className="page clinics">
      <h1>CLINICS</h1>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button
          onClick={handleOnboard}
          style={{
            padding: "12px 24px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
          }}
        >
          Onboard New Clinic
        </button>
      </div>
      <div className="banner" style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        {clinics && clinics.length > 0 ? (
          clinics.map((clinic) => {
            return (
              <div 
                className="card" 
                key={clinic._id}
                style={{
                  backgroundColor: "#ffffff",
                  padding: "30px",
                  borderRadius: "15px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  marginBottom: "20px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h4 style={{ margin: 0, fontSize: "24px", color: "#333" }}>{clinic.name}</h4>
                  <div style={{ display: "flex", gap: "15px" }}>
                    <FaEdit
                      onClick={() => handleEdit(clinic._id)}
                      style={{ 
                        cursor: "pointer", 
                        color: "#2196F3",
                        fontSize: "22px",
                        transition: "transform 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.transform = "scale(1.2)"}
                      onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                      title="Edit Clinic"
                    />
                    <FaTrash
                      onClick={() => handleDelete(clinic._id)}
                      style={{ 
                        cursor: "pointer", 
                        color: "#f44336",
                        fontSize: "22px",
                        transition: "transform 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.transform = "scale(1.2)"}
                      onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                      title="Delete Clinic"
                    />
                  </div>
                </div>
                <div className="details">
                  <p>
                    <strong>Address:</strong> <span>{clinic.address}</span>
                  </p>
                  <p>
                    <strong>Phone:</strong> <span>{clinic.phone}</span>
                  </p>
                  <p>
                    <strong>Email:</strong> <span>{clinic.email}</span>
                  </p>
                  <p>
                    <strong>Services:</strong> <span>
                      {clinic.services && clinic.services.length > 0
                        ? clinic.services.join(", ")
                        : "No services available"}
                    </span>
                  </p>
                  <p>
                    <strong>Consultation Tariff:</strong> <span style={{ color: "#4CAF50", fontWeight: "600" }}>
                      {clinic.tariff?.consultation
                        ? `${clinic.tariff.consultation} TND`
                        : "0 TND"}
                    </span>
                  </p>
                  <p>
                    <strong>Status:</strong> <span>
                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          backgroundColor: clinic.isActive ? "#4CAF50" : "#f44336",
                          color: "white",
                          fontSize: "13px",
                          fontWeight: "600"
                        }}
                      >
                        {clinic.isActive ? "✓ Active" : "✗ Inactive"}
                      </span>
                    </span>
                  </p>
                  <p>
                    <strong>Admin:</strong> <span>
                      {clinic.admin
                        ? `${clinic.admin.firstName || ""} ${clinic.admin.lastName || ""}`
                        : "No Admin assigned"}
                    </span>
                  </p>
                  {clinic.createdAt && (
                    <p>
                      <strong>Created:</strong> <span>
                        {new Date(clinic.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </p>
                  )}
                  {clinic.updatedAt && (
                    <p>
                      <strong>Last Updated:</strong> <span>
                        {new Date(clinic.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <h1>No Clinics Found!</h1>
        )}
      </div>
    </section>
  );
};

export default Clinics;

