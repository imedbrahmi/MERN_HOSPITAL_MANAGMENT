import axios from "axios";
import React, { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate, useNavigate } from "react-router-dom";

const AddNewReceptionist = () => {
  const { isAuthenticated, user } = useContext(Context);
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    CIN: "",
    email: "",
    dob: "",
    gender: "",
    password: "",
    clinicId: "",
  });

  useEffect(() => {
    if (isAuthenticated && (user?.role === "Admin" || user?.role === "SuperAdmin")) {
      if (user?.role === "SuperAdmin") {
        fetchClinics();
      } else {
        // Admin : utiliser son clinicId
        setFormData(prev => ({ ...prev, clinicId: user.clinicId || "" }));
      }
    }
  }, [isAuthenticated, user]);

  const fetchClinics = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:4000/api/v1/clinics/getAll",
        { withCredentials: true }
      );
      setClinics(data.clinics || []);
    } catch (error) {
      console.error("Failed to fetch clinics:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:4000/api/v1/user/receptionist/addnew",
        formData,
        { withCredentials: true }
      );
      toast.success("Receptionist created successfully");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create receptionist");
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  if (user?.role !== "Admin" && user?.role !== "SuperAdmin") {
    return <Navigate to={"/"} />;
  }

  return (
    <section className="page add-receptionist">
      <h1>ADD NEW RECEPTIONIST</h1>
      <div className="container form-component">
        <form onSubmit={handleSubmit} className="add-admin-form">
          <input
            type="text"
            placeholder="First Name *"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Last Name *"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email *"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="tel"
            placeholder="Phone *"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="CIN *"
            value={formData.CIN}
            onChange={(e) => setFormData({ ...formData, CIN: e.target.value })}
            required
          />
          <input
            type="date"
            placeholder="Date of Birth *"
            value={formData.dob}
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            required
          />
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            required
          >
            <option value="">Select Gender *</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {user?.role === "SuperAdmin" && (
            <select
              value={formData.clinicId}
              onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
            >
              <option value="">Select Clinic (Optional)</option>
              {clinics.map((clinic) => (
                <option key={clinic._id} value={clinic._id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          )}
          <input
            type="password"
            placeholder="Password *"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button type="submit">Create Receptionist</button>
        </form>
      </div>
    </section>
  );
};

export default AddNewReceptionist;

