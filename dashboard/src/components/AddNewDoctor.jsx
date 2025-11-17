// Small update for commit
import React, { useContext, useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../main";
import axios from "axios";
import { API_BASE_URL } from '../utils/api';

const AddNewDoctor = () => {
  const { isAuthenticated, setIsAuthenticated, user } = useContext(Context);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [CIN, setCIN] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [doctorDepartment, setDoctorDepartment] = useState("");
  const [docAvatar, setDocAvatar] = useState("");
  const [docAvatarPreview, setDocAvatarPreview] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [clinics, setClinics] = useState([]);

  const navigate = useNavigate();

  const fetchClinics = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/clinics/all`,
        { withCredentials: true }
      );
      setClinics(data.clinics || []);
    } catch (error) {
      console.error("Failed to fetch clinics:", error);
      toast.error(error.response?.data?.message || "Failed to fetch clinics");
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user?.role === "SuperAdmin") {
        fetchClinics();
      } else if (user?.role === "Admin") {
        setClinicId(user.clinicId || "");
      }
    }
  }, [isAuthenticated, user, fetchClinics]);

  const departmentsArray = [
    "Pediatrics",
    "Orthopedics",
    "Cardiology",
    "Neurology",
    "Oncology",
    "Radiology",
    "Physical Therapy",
    "Dermatology",
    "ENT",
  ];

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setDocAvatarPreview(reader.result);
      setDocAvatar(file);
    };
  };

  const handleAddNewDoctor = async (e) => {
    e.preventDefault();

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !CIN ||
      !dob ||
      !gender ||
      !password ||
      !doctorDepartment ||
      !docAvatar
    ) {
      return toast.error("Please fill all fields correctly");
    }

    if (user?.role === "SuperAdmin" && !clinicId) {
      return toast.error("Please select a clinic");
    }

    try {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("password", password);
      formData.append("CIN", CIN);
      formData.append("dob", dob);
      formData.append("gender", gender);
      formData.append("doctorDepartment", doctorDepartment);
      formData.append("docAvatar", docAvatar);

      if (user?.role === "SuperAdmin" && clinicId) {
        formData.append("clinicId", clinicId);
      }

      await axios
        .post(`${API_BASE_URL}/user/doctor/addnew`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {
          toast.success(res.data.message);
          setIsAuthenticated(true);
          navigate("/");
          setFirstName("");
          setLastName("");
          setEmail("");
          setPhone("");
          setCIN("");
          setDob("");
          setGender("");
          setPassword("");
          setDoctorDepartment("");
          setClinicId("");
          setDocAvatar("");
          setDocAvatarPreview("");
        });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <section className="page">
      <section className="container add-doctor-form">
        <img src="/logo.png" alt="logo" className="logo"/>
        <h1 className="form-title">ADD A NEW DOCTOR</h1>

        <form onSubmit={handleAddNewDoctor}>
          <div className="first-wrapper">
            <div>
              <img
                src={docAvatarPreview ? `${docAvatarPreview}` : "/docHolder.jpg"}
                alt="Doctor Avatar"
              />
              <input type="file" onChange={handleAvatar} />
            </div>

            <div>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />

              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />

              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="number"
                placeholder="Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <input
                type="number"
                placeholder="CIN (ID Number)"
                value={CIN}
                onChange={(e) => setCIN(e.target.value)}
              />

              <input
                type="date"
                placeholder="Date of Birth"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />

              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <select
                value={doctorDepartment}
                onChange={(e) => setDoctorDepartment(e.target.value)}
              >
                <option value="">Select Department</option>
                {departmentsArray.map((depart, index) => (
                  <option value={depart} key={index}>
                    {depart}
                  </option>
                ))}
              </select>

              {user?.role === "SuperAdmin" && (
                <select
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  required
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    width: "100%",
                  }}
                >
                  <option value="">Select Clinic *</option>
                  {clinics.map((clinic) => (
                    <option key={clinic._id} value={clinic._id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              )}

              <button type="submit">Register New Doctor</button>
            </div>
          </div>
        </form>
      </section>
    </section>
  );
};

export default AddNewDoctor;
