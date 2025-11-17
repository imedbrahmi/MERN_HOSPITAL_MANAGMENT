import axios from "axios";
import React, { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate, useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../utils/api';

const AddNewReceptionist = () => {
  const { isAuthenticated, user } = useContext(Context);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    CIN: "",
    email: "",
    dob: "",
    gender: "",
    password: "",
  });

  useEffect(() => {
    // Seul Admin peut créer des réceptionnistes
    // Le clinicId sera assigné automatiquement depuis le token Admin
    if (isAuthenticated && user?.role === "Admin") {
      // Vérifier que l'Admin a un clinicId
      if (!user.clinicId) {
        toast.error("You are not assigned to any clinic. Please contact SuperAdmin.");
        navigate("/");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE_URL}/user/receptionist/addnew`,
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

  // Seul Admin peut créer des réceptionnistes
  if (user?.role !== "Admin") {
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

