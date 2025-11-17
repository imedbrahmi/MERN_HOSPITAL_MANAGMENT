import React, { useContext, useState, useEffect } from "react";
import { Context } from "../main";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE_URL } from '../utils/api';

const Onboarding = () => {
  const { isAuthenticated, user } = useContext(Context);
  const navigate = useNavigate();

  // État pour les données de la clinique
  const [clinicData, setClinicData] = useState({
    clinicName: "",
    clinicAddress: "",
    clinicPhone: "",
    clinicEmail: "",
    clinicServices: "",
    clinicTariff: "",
  });

  // État pour les données de l'Admin
  const [adminData, setAdminData] = useState({
    adminFirstName: "",
    adminLastName: "",
    adminPhone: "",
    adminCIN: "",
    adminEmail: "",
    adminDob: "",
    adminGender: "",
    adminPassword: "",
    adminConfirmPassword: "",
  });
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [unassignedAdmins, setUnassignedAdmins] = useState([]);
  const [adminMode, setAdminMode] = useState("new"); // "new" ou "existing"

  const handleClinicChange = (e) => {
    const { name, value } = e.target;
    setClinicData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchUnassignedAdmins = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/user/admins/unassigned`,
          { withCredentials: true }
        );
        setUnassignedAdmins(data.admins || []);
      } catch (error) {
        console.error("Error fetching unassigned admins:", error);
      }
    };
    fetchUnassignedAdmins();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation des champs de la clinique
    if (
      !clinicData.clinicName ||
      !clinicData.clinicAddress ||
      !clinicData.clinicPhone ||
      !clinicData.clinicEmail
    ) {
      return toast.error("Please fill all clinic required fields");
    }

    // Validation selon le mode choisi
    if (adminMode === "existing") {
      if (!selectedAdminId) {
        return toast.error("Please select an existing admin");
      }
    } else {
      // Validation des champs de l'Admin pour création
      if (
        !adminData.adminFirstName ||
        !adminData.adminLastName ||
        !adminData.adminPhone ||
        !adminData.adminCIN ||
        !adminData.adminEmail ||
        !adminData.adminDob ||
        !adminData.adminGender ||
        !adminData.adminPassword
      ) {
        return toast.error("Please fill all admin required fields");
      }

      // Vérifier que les mots de passe correspondent
      if (adminData.adminPassword !== adminData.adminConfirmPassword) {
        return toast.error("Passwords do not match");
      }
    }

    try {
      // Convertir services en tableau
      const servicesArray = clinicData.clinicServices
        ? clinicData.clinicServices.split(",").map((s) => s.trim()).filter((s) => s)
        : [];

      const payload = {
        // Données de la clinique
        clinicName: clinicData.clinicName,
        clinicAddress: clinicData.clinicAddress,
        clinicPhone: clinicData.clinicPhone,
        clinicEmail: clinicData.clinicEmail,
        clinicServices: servicesArray,
        clinicTariff: {
          consultation: parseFloat(clinicData.clinicTariff) || 0,
        },
        // Données de l'Admin : soit adminId (si existant), soit données de création
        ...(adminMode === "existing" 
          ? { adminId: selectedAdminId }
          : {
              adminFirstName: adminData.adminFirstName,
              adminLastName: adminData.adminLastName,
              adminPhone: adminData.adminPhone,
              adminCIN: adminData.adminCIN,
              adminEmail: adminData.adminEmail,
              adminDob: adminData.adminDob,
              adminGender: adminData.adminGender,
              adminPassword: adminData.adminPassword,
            }
        ),
      };

      const { data } = await axios.post(
        `${API_BASE_URL}/clinics/onboard`,
        payload,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success(data.message);
      navigate("/clinics");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create clinic and admin");
    }
  };

  // Route guard : Seul SuperAdmin peut accéder
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "SuperAdmin") {
    return <Navigate to="/" />;
  }

  return (
    <section className="page">
      <section className="container form-component add-admin-form">
        <img src="/logo.png" alt="logo" className="logo" />
        <h1 className="form-title">CLINIC ONBOARDING</h1>
        <p style={{ textAlign: "center", marginBottom: "30px", color: "#666" }}>
          Create a new clinic and its associated Admin in one step
        </p>
        <form onSubmit={handleSubmit}>
          <h2 style={{ fontSize: "20px", color: "#333", marginBottom: "20px", borderBottom: "2px solid #4CAF50", paddingBottom: "10px" }}>
            Clinic Information
          </h2>
          <div>
            <input
              type="text"
              name="clinicName"
              placeholder="Clinic Name *"
              value={clinicData.clinicName}
              onChange={handleClinicChange}
              required
            />
            <input
              type="text"
              name="clinicAddress"
              placeholder="Clinic Address *"
              value={clinicData.clinicAddress}
              onChange={handleClinicChange}
              required
            />
          </div>
          <div>
            <input
              type="tel"
              name="clinicPhone"
              placeholder="Clinic Phone *"
              value={clinicData.clinicPhone}
              onChange={handleClinicChange}
              required
            />
            <input
              type="email"
              name="clinicEmail"
              placeholder="Clinic Email *"
              value={clinicData.clinicEmail}
              onChange={handleClinicChange}
              required
            />
          </div>
          <div>
            <input
              type="text"
              name="clinicServices"
              placeholder="Services (comma-separated)"
              value={clinicData.clinicServices}
              onChange={handleClinicChange}
            />
            <input
              type="number"
              name="clinicTariff"
              placeholder="Consultation Tariff (TND)"
              value={clinicData.clinicTariff}
              onChange={handleClinicChange}
              min="0"
              step="0.01"
            />
          </div>

          <h2 style={{ fontSize: "20px", color: "#333", marginBottom: "20px", marginTop: "30px", borderBottom: "2px solid #2196F3", paddingBottom: "10px" }}>
            Admin Information
          </h2>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>
              <input
                type="radio"
                name="adminMode"
                value="new"
                checked={adminMode === "new"}
                onChange={(e) => setAdminMode(e.target.value)}
                style={{ marginRight: "8px" }}
              />
              Create New Admin
            </label>
            <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>
              <input
                type="radio"
                name="adminMode"
                value="existing"
                checked={adminMode === "existing"}
                onChange={(e) => setAdminMode(e.target.value)}
                style={{ marginRight: "8px" }}
              />
              Select Existing Admin
            </label>
          </div>
          {adminMode === "existing" ? (
            <div>
              <select
                value={selectedAdminId}
                onChange={(e) => setSelectedAdminId(e.target.value)}
                required
                style={{ width: "100%" }}
              >
                <option value="">Select Admin</option>
                {unassignedAdmins.map((admin) => (
                  <option value={admin._id} key={admin._id}>
                    {admin.firstName} {admin.lastName} ({admin.email})
                  </option>
                ))}
              </select>
              {unassignedAdmins.length === 0 && (
                <p style={{ color: "#666", marginTop: "10px" }}>
                  No unassigned admins available. Please create a new admin.
                </p>
              )}
            </div>
          ) : (
            <>
            <div>
            <input
              type="text"
              name="adminFirstName"
              placeholder="Admin First Name *"
              value={adminData.adminFirstName}
              onChange={handleAdminChange}
              required
            />
            <input
              type="text"
              name="adminLastName"
              placeholder="Admin Last Name *"
              value={adminData.adminLastName}
              onChange={handleAdminChange}
              required
            />
          </div>
          <div>
            <input
              type="tel"
              name="adminPhone"
              placeholder="Admin Phone *"
              value={adminData.adminPhone}
              onChange={handleAdminChange}
              required
            />
            <input
              type="number"
              name="adminCIN"
              placeholder="Admin CIN *"
              value={adminData.adminCIN}
              onChange={handleAdminChange}
              required
            />
          </div>
          <div>
            <input
              type="email"
              name="adminEmail"
              placeholder="Admin Email *"
              value={adminData.adminEmail}
              onChange={handleAdminChange}
              required
            />
            <input
              type="date"
              name="adminDob"
              placeholder="Date of Birth *"
              value={adminData.adminDob}
              onChange={handleAdminChange}
              required
            />
          </div>
          <div>
            <select
              name="adminGender"
              value={adminData.adminGender}
              onChange={handleAdminChange}
              required
            >
              <option value="">Select Gender *</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <input
              type="password"
              name="adminPassword"
              placeholder="Admin Password *"
              value={adminData.adminPassword}
              onChange={handleAdminChange}
              required
            />
          </div>
          <div>
            <input
              type="password"
              name="adminConfirmPassword"
              placeholder="Confirm Password *"
              value={adminData.adminConfirmPassword}
              onChange={handleAdminChange}
              required
            />
          </div>
            </>
          )}
          <div style={{ justifyContent: "center", alignItems: "center", display: "flex", gap: "10px" }}>
            <button type="submit">Create Clinic & Admin</button>
            <button
              type="button"
              onClick={() => navigate("/clinics")}
              style={{ backgroundColor: "#f44336" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </section>
  );
};

export default Onboarding;

