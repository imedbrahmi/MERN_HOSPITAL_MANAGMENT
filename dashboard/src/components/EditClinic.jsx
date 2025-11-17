import React, { useContext, useState, useEffect } from "react";
import { Context } from "../main";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE_URL } from '../utils/api';

const EditClinic = () => {
  const { isAuthenticated, user } = useContext(Context);
  const navigate = useNavigate();
  const { id } = useParams();

  const [clinicData, setClinicData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    services: "",
    consultation: "",
    isActive: true,
  });
  const [adminData, setAdminData] = useState({
    adminFirstName: "",
    adminLastName: "",
    adminPhone: "",
    adminCIN: "",
    adminEmail: "",
    adminDob: "",
    adminGender: "",
    adminPassword: "",
  });
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [unassignedAdmins, setUnassignedAdmins] = useState([]);
  const [adminMode, setAdminMode] = useState("edit"); // "edit" ou "change"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/clinics/${id}`,
          { withCredentials: true }
        );
        const clinic = data.clinic;
        const admin = data.admin;
        
        setClinicData({
          name: clinic.name || "",
          address: clinic.address || "",
          phone: clinic.phone || "",
          email: clinic.email || "",
          services: clinic.services ? clinic.services.join(", ") : "",
          consultation: clinic.tariff?.consultation || "",
          isActive: clinic.isActive !== undefined ? clinic.isActive : true,
        });
        
        if (admin) {
          setAdminData({
            adminFirstName: admin.firstName || "",
            adminLastName: admin.lastName || "",
            adminPhone: admin.phone || "",
            adminCIN: admin.CIN || "",
            adminEmail: admin.email || "",
            adminDob: admin.dob ? admin.dob.substring(0, 10) : "",
            adminGender: admin.gender || "",
            adminPassword: "", // Ne pas pré-remplir le mot de passe
          });
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch clinic");
        navigate("/clinics");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClinic();
    }
  }, [id, navigate]);

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

  const handleClinicChange = (e) => {
    const { name, value, type, checked } = e.target;
    setClinicData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation des champs de la clinique
    if (!clinicData.name || !clinicData.address || !clinicData.phone || !clinicData.email) {
      return toast.error("Please fill all clinic required fields");
    }

    // Validation selon le mode choisi
    if (adminMode === "change") {
      if (!selectedAdminId) {
        return toast.error("Please select an existing admin");
      }
    } else {
      // Validation des champs de l'Admin pour modification (si au moins un champ est rempli)
      const hasAdminData = adminData.adminFirstName || adminData.adminLastName || 
                           adminData.adminPhone || adminData.adminCIN || 
                           adminData.adminEmail || adminData.adminDob || 
                           adminData.adminGender || adminData.adminPassword;
      
      if (hasAdminData) {
        if (!adminData.adminFirstName || !adminData.adminLastName || 
            !adminData.adminPhone || !adminData.adminCIN || 
            !adminData.adminEmail || !adminData.adminDob || 
            !adminData.adminGender) {
          return toast.error("Please fill all admin required fields");
        }
      }
    }

    try {
      // Convertir services en tableau
      const servicesArray = clinicData.services
        ? clinicData.services.split(",").map((s) => s.trim()).filter((s) => s)
        : [];

      // Vérifier si des données Admin sont fournies (pour le mode edit)
      const hasAdminData = adminData.adminFirstName || adminData.adminLastName || 
                           adminData.adminPhone || adminData.adminCIN || 
                           adminData.adminEmail || adminData.adminDob || 
                           adminData.adminGender || adminData.adminPassword;

      const payload = {
        // Données de la clinique
        name: clinicData.name,
        address: clinicData.address,
        phone: clinicData.phone,
        email: clinicData.email,
        services: servicesArray,
        tariff: {
          consultation: parseFloat(clinicData.consultation) || 0,
        },
        isActive: clinicData.isActive,
        // Données de l'Admin : soit adminId (si changement), soit données de modification
        ...(adminMode === "change" 
          ? { adminId: selectedAdminId }
          : (hasAdminData && {
              adminFirstName: adminData.adminFirstName,
              adminLastName: adminData.adminLastName,
              adminPhone: adminData.adminPhone,
              adminCIN: adminData.adminCIN,
              adminEmail: adminData.adminEmail,
              adminDob: adminData.adminDob,
              adminGender: adminData.adminGender,
              ...(adminData.adminPassword && { adminPassword: adminData.adminPassword }),
            })
        ),
      };

      const { data } = await axios.put(
        `${API_BASE_URL}/clinics/${id}`,
        payload,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success(data.message);
      navigate("/clinics");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update clinic and admin");
    }
  };

  // Route guard : Seul SuperAdmin peut accéder
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "SuperAdmin") {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <section className="page">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading clinic data...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <section className="container form-component add-admin-form">
        <img src="/logo.png" alt="logo" className="logo" />
        <h1 className="form-title">EDIT CLINIC</h1>
        <form onSubmit={handleSubmit}>
          <h2 style={{ fontSize: "20px", color: "#333", marginBottom: "20px", borderBottom: "2px solid #4CAF50", paddingBottom: "10px" }}>
            Clinic Information
          </h2>
          <div>
            <input
              type="text"
              name="name"
              placeholder="Clinic Name *"
              value={clinicData.name}
              onChange={handleClinicChange}
              required
            />
            <input
              type="text"
              name="address"
              placeholder="Address *"
              value={clinicData.address}
              onChange={handleClinicChange}
              required
            />
          </div>
          <div>
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number *"
              value={clinicData.phone}
              onChange={handleClinicChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={clinicData.email}
              onChange={handleClinicChange}
              required
            />
          </div>
          <div>
            <input
              type="text"
              name="services"
              placeholder="Services (comma-separated)"
              value={clinicData.services}
              onChange={handleClinicChange}
            />
            <input
              type="number"
              name="consultation"
              placeholder="Consultation Tariff (TND)"
              value={clinicData.consultation}
              onChange={handleClinicChange}
              min="0"
              step="0.01"
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <input
              type="checkbox"
              name="isActive"
              checked={clinicData.isActive}
              onChange={handleClinicChange}
              id="isActive"
            />
            <label htmlFor="isActive">Active</label>
          </div>

          <h2 style={{ fontSize: "20px", color: "#333", marginBottom: "20px", marginTop: "30px", borderBottom: "2px solid #2196F3", paddingBottom: "10px" }}>
            Admin Information
          </h2>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>
              <input
                type="radio"
                name="adminMode"
                value="edit"
                checked={adminMode === "edit"}
                onChange={(e) => setAdminMode(e.target.value)}
                style={{ marginRight: "8px" }}
              />
              Edit Current Admin
            </label>
            <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>
              <input
                type="radio"
                name="adminMode"
                value="change"
                checked={adminMode === "change"}
                onChange={(e) => setAdminMode(e.target.value)}
                style={{ marginRight: "8px" }}
              />
              Change to Another Admin
            </label>
          </div>
          {adminMode === "change" ? (
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
                  No unassigned admins available. Please edit the current admin.
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
              />
              <input
                type="text"
                name="adminLastName"
                placeholder="Admin Last Name *"
                value={adminData.adminLastName}
                onChange={handleAdminChange}
              />
            </div>
            <div>
              <input
                type="tel"
                name="adminPhone"
                placeholder="Admin Phone *"
                value={adminData.adminPhone}
                onChange={handleAdminChange}
              />
              <input
                type="number"
                name="adminCIN"
                placeholder="Admin CIN *"
                value={adminData.adminCIN}
                onChange={handleAdminChange}
              />
            </div>
            <div>
              <input
                type="email"
                name="adminEmail"
                placeholder="Admin Email *"
                value={adminData.adminEmail}
                onChange={handleAdminChange}
              />
              <input
                type="date"
                name="adminDob"
                placeholder="Date of Birth *"
                value={adminData.adminDob}
                onChange={handleAdminChange}
              />
            </div>
            <div>
              <select
                name="adminGender"
                value={adminData.adminGender}
                onChange={handleAdminChange}
              >
                <option value="">Select Gender *</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <input
                type="password"
                name="adminPassword"
                placeholder="Admin Password (leave empty to keep current)"
                value={adminData.adminPassword}
                onChange={handleAdminChange}
              />
            </div>
            </>
          )}

          <div style={{ justifyContent: "center", alignItems: "center", display: "flex", gap: "10px" }}>
            <button type="submit">Update Clinic & Admin</button>
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

export default EditClinic;

