import React, { useContext, useState, useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../main";
import axios from "axios";
import { API_BASE_URL } from '../utils/api';

const EditDoctor = () => {
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
  const [doctorDepartment, setDoctorDepartment] = useState("");
  const [docAvatar, setDocAvatar] = useState(null);
  const [docAvatarPreview, setDocAvatarPreview] = useState("");
  const [currentAvatar, setCurrentAvatar] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [clinics, setClinics] = useState([]);

  const departmentsArray = [
    "Pediatrics", "Orthopedics", "Cardiology", "Neurology",
    "Oncology", "Radiology", "Physical Therapy", "Dermatology", "ENT"
  ];

  useEffect(() => {
    if (isAuthenticated && (user?.role === "Admin" || user?.role === "SuperAdmin")) {
      fetchDoctor();
      // Si SuperAdmin, charger la liste des cliniques
      if (user?.role === "SuperAdmin") {
        fetchClinics();
      }
    }
  }, [isAuthenticated, user, id]);

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

  const fetchDoctor = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/user/doctors`,
        { withCredentials: true }
      );
      const doctor = data.doctors.find(d => d._id === id);
      if (doctor) {
        setFirstName(doctor.firstName);
        setLastName(doctor.lastName || "");
        setEmail(doctor.email);
        setPhone(doctor.phone);
        setCIN(doctor.CIN);
        setDob(doctor.dob.substring(0, 10));
        setGender(doctor.gender);
        setDoctorDepartment(doctor.doctorDepartment);
        // Set clinicId si disponible (pour SuperAdmin)
        if (doctor.clinicId) {
          setClinicId(doctor.clinicId._id || doctor.clinicId);
        }
        if (doctor.docAvatar?.url) {
          setCurrentAvatar(doctor.docAvatar.url);
          setDocAvatarPreview(doctor.docAvatar.url);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch doctor");
    }
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setDocAvatarPreview(reader.result);
        setDocAvatar(file);
      };
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !phone || !CIN || !dob || !gender || !doctorDepartment) {
      return toast.error("Please fill all required fields");
    }

    try {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("CIN", CIN);
      formData.append("dob", dob);
      formData.append("gender", gender);
      formData.append("doctorDepartment", doctorDepartment);
      if (docAvatar) {
        formData.append("docAvatar", docAvatar);
      }
      // Ajouter clinicId seulement si c'est un SuperAdmin
      if (user?.role === "SuperAdmin" && clinicId) {
        formData.append("clinicId", clinicId);
      }

      await axios.put(
        `${API_BASE_URL}/user/doctor/${id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Doctor updated successfully");
      navigate("/doctors");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update doctor");
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  if (user?.role !== "Admin" && user?.role !== "SuperAdmin") {
    return <Navigate to={"/"} />;
  }

  return (
    <section className="page edit-doctor">
      <h1>EDIT DOCTOR</h1>
      <div className="container form-component">
        <form onSubmit={handleUpdate} className="add-admin-form">
          <div style={{ marginBottom: "20px" }}>
            {docAvatarPreview && (
              <img
                src={docAvatarPreview}
                alt="Doctor Avatar Preview"
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginBottom: "15px",
                  border: "3px solid #4a90e2",
                }}
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatar}
              style={{ marginBottom: "15px" }}
            />
            <p style={{ fontSize: "14px", color: "#666" }}>
              {docAvatar ? "New image selected" : "Current image (leave empty to keep current)"}
            </p>
          </div>

          <input
            type="text"
            placeholder="First Name *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name *"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
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
          <select
            value={doctorDepartment}
            onChange={(e) => setDoctorDepartment(e.target.value)}
            required
          >
            <option value="">Select Department *</option>
            {departmentsArray.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
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
          <button type="submit">Update Doctor</button>
          <button
            type="button"
            onClick={() => navigate("/doctors")}
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

export default EditDoctor;

