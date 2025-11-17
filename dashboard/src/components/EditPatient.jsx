import React, { useContext, useState, useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../main";
import axios from "axios";
import { API_BASE_URL } from '../utils/api';

const EditPatient = () => {
  const { isAuthenticated, user } = useContext(Context);
  const { id } = useParams();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [CIN, setCIN] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchPatient();
    }
  }, [isAuthenticated, id]);

  const fetchPatient = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/user/patient/${id}`,
        { withCredentials: true }
      );
      const patient = data.patient;
      setFirstName(patient.firstName);
      setLastName(patient.lastName || "");
      setEmail(patient.email);
      setPhone(patient.phone);
      setCIN(patient.CIN);
      setDob(patient.dob.substring(0, 10));
      setGender(patient.gender);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch patient");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!firstName || !email || !phone || !CIN || !dob || !gender) {
      return toast.error("Please fill all required fields");
    }

    try {
      await axios.put(
        `${API_BASE_URL}/user/patient/${id}`,
        {
          firstName,
          lastName,
          email,
          phone,
          CIN,
          dob,
          gender,
        },
        { withCredentials: true }
      );

      toast.success("Patient updated successfully");
      navigate("/patients");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update patient");
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  if (user?.role !== "Admin" && user?.role !== "SuperAdmin" && user?.role !== "Receptionist") {
    return <Navigate to={"/"} />;
  }

  return (
    <section className="page edit-patient">
      <h1>EDIT PATIENT</h1>
      <div className="container form-component">
        <form onSubmit={handleUpdate} className="add-admin-form">
          <input
            type="text"
            placeholder="First Name *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Phone *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="CIN *"
            value={CIN}
            onChange={(e) => setCIN(e.target.value)}
            required
          />
          <input
            type="date"
            placeholder="Date of Birth *"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">Select Gender *</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <button type="submit">Update Patient</button>
          <button
            type="button"
            onClick={() => navigate("/patients")}
            style={{
              backgroundColor: "#95a5a6",
              marginTop: "10px",
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    </section>
  );
};

export default EditPatient;

