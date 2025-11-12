import axios from "axios";
import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate, useNavigate } from "react-router-dom";

const RegisterPatient = () => {
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
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    try {
      await axios.post(
        "http://localhost:4000/api/v1/user/patient/register",
        { ...formData, role: "Patient" },
        { withCredentials: true }
      );
      toast.success("Patient registered successfully");
      navigate("/patients");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to register patient");
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  if (user?.role !== "Receptionist" && user?.role !== "Admin") {
    return <Navigate to={"/"} />;
  }

  return (
    <section className="page register-patient">
      <h1>REGISTER NEW PATIENT</h1>
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
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
          <input
            type="password"
            placeholder="Confirm Password *"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
          <button type="submit">Register Patient</button>
        </form>
      </div>
    </section>
  );
};

export default RegisterPatient;

