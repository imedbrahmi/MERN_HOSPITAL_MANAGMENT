import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate, useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../utils/api';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [clinicFilter, setClinicFilter] = useState("");
  const [clinics, setClinics] = useState([]);
  const { isAuthenticated, user } = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, [searchTerm, departmentFilter, clinicFilter]);

  useEffect(() => {
    // Charger les cliniques seulement pour SuperAdmin
    if (isAuthenticated && user?.role === "SuperAdmin") {
      fetchClinics();
    }
  }, [isAuthenticated, user]);

  const fetchClinics = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/clinics/all`,
        { withCredentials: true }
      );
      setClinics(data.clinics || []);
    } catch (error) {
      console.error("Failed to fetch clinics:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (departmentFilter) params.append("department", departmentFilter);
      if (clinicFilter) params.append("clinicId", clinicFilter);
      
      const { data } = await axios.get(
        `${API_BASE_URL}/user/doctors?${params.toString()}`,
        { withCredentials: true }
      );
      setDoctors(data.doctors);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch doctors");
    }
  };

  const handleDelete = async (doctorId) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/user/doctor/${doctorId}`,
        { withCredentials: true }
      );
      toast.success("Doctor deleted successfully");
      fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete doctor");
    }
  };

  const departmentsArray = [
    "Pediatrics", "Orthopedics", "Cardiology", "Neurology",
    "Oncology", "Radiology", "Physical Therapy", "Dermatology", "ENT"
  ];

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }
  return (
    <section className="page doctors">
      <h1>DOCTORS</h1>
      
      {/* Barre de recherche et filtres */}
      <div style={{ 
        display: "flex", 
        gap: "15px", 
        marginBottom: "30px", 
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        <input
          type="text"
          placeholder="Search by name, email, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: "250px",
            padding: "12px 20px",
            fontSize: "16px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#fff",
          }}
        />
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          style={{
            padding: "12px 20px",
            fontSize: "16px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          <option value="">All Departments</option>
          {departmentsArray.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        {user?.role === "SuperAdmin" && (
          <select
            value={clinicFilter}
            onChange={(e) => setClinicFilter(e.target.value)}
            style={{
              padding: "12px 20px",
              fontSize: "16px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="">All Clinics</option>
            {clinics.map((clinic) => (
              <option key={clinic._id} value={clinic._id}>
                {clinic.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="banner">
        {doctors && doctors.length > 0 ? (
          doctors.map((element) => {
            return (
              <div className="card" key={element._id} style={{ position: "relative" }}>
                <img
                  src={element.docAvatar && element.docAvatar.url}
                  alt="doctor avatar"
                />
                <h4>{`${element.firstName} ${element.lastName}`}</h4>
                <div className="details">
                  <p>
                    Email: <span>{element.email}</span>
                  </p>
                  <p>
                    Phone: <span>{element.phone}</span>
                  </p>
                  <p>
                    Gender: <span>{element.gender}</span>
                  </p>
                  <p>
                    DOB: <span>{element.dob.substring(0, 10)}</span>
                  </p>
                  {element.clinicId && (
                    <p>
                      Clinic: <span>{element.clinicId.name || element.clinicId}</span>
                    </p>
                  )}
                  <p>
                    Department: <span>{element.doctorDepartment}</span>
                  </p>
                  <p>
                    CIN: <span>{element.CIN}</span>
                  </p>
                  
                  
                </div>
                {(user?.role === "Admin" || user?.role === "SuperAdmin") && (
                  <div style={{ 
                    display: "flex", 
                    gap: "10px", 
                    marginTop: "20px",
                    justifyContent: "center"
                  }}>
                    <button
                      onClick={() => navigate(`/doctor/edit/${element._id}`)}
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
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(element._id)}
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
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <h1>No Registered Doctors Found!</h1>
        )}
      </div>
    </section>
  );
};

export default Doctors;
