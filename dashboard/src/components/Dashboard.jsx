import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { GoCheckCircleFill } from "react-icons/go";
import { AiFillCloseCircle } from "react-icons/ai";


const Dashboard = () => {

  const {isAuthenticated, user} = useContext(Context);
  
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFilter, searchTerm]);

  const fetchAppointments = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (dateFilter) params.append("date", dateFilter);
      if (searchTerm) params.append("search", searchTerm);
      
      const { data } = await axios.get(
        `http://localhost:4000/api/v1/appointment/getAll?${params.toString()}`,
        { withCredentials: true }
      );
      setAppointments(data.appointments || []);
      setFilteredAppointments(data.appointments || []);
      setTotalAppointments(data.appointments?.length || 0);
    } catch (error) {
      setAppointments([]);
      setFilteredAppointments([]);
      setTotalAppointments(0);
    }
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      // Seulement pour Admin, Receptionist et SuperAdmin (pas pour Doctor)
      if (user?.role === "Doctor") {
        setTotalDoctors(0);
        return;
      }
      
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/user/doctors",
          { withCredentials: true }
        );
        setTotalDoctors(data.doctors?.length || 0);
      } catch (error) {
        setTotalDoctors(0);
      }
    };

    fetchDoctors();
  }, [user?.role]);

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      const { data } = await axios.put(
        `http://localhost:4000/api/v1/appointment/update/${appointmentId}`,
        { status },
        { withCredentials: true }
      );
      const updatedAppointments = appointments.map((appointment) =>
        appointment._id === appointmentId
          ? { ...appointment, status }
          : appointment
      );
      setAppointments(updatedAppointments);
      setFilteredAppointments(updatedAppointments);
      setTotalAppointments(updatedAppointments.length);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update appointment");
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <>
      <section className="dashboard page">
        <div className="banner">
          <div className="firstBox">
            <img src="/doc.png" alt="docImg" />
            <div className="content">
              <div>
                <p>Hello ,</p>
                <h5>
                  {user &&
                    `${user.firstName} ${user.lastName}`}{" "}
                </h5>
              </div>
              <p>
                Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                Facilis, nam molestias. Eaque molestiae ipsam commodi neque.
                Assumenda repellendus necessitatibus itaque.
              </p>
            </div>
          </div>
          <div className="secondBox">
            <p>Total Appointments</p>
            <h3>{totalAppointments}</h3>
          </div>
          {user?.role !== "Doctor" && user?.role !== "Receptionist" && (
            <div className="thirdBox">
              <p>Registered Doctors</p>
              <h3>{totalDoctors}</h3>
            </div>
          )}
        </div>
        <div className="banner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h5>Appointments</h5>
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "10px 15px",
                  fontSize: "14px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  minWidth: "200px",
                }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "10px 15px",
                  fontSize: "14px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                }}
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  padding: "10px 15px",
                  fontSize: "14px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                }}
              />
              {(statusFilter || dateFilter || searchTerm) && (
                <button
                  onClick={() => {
                    setStatusFilter("");
                    setDateFilter("");
                    setSearchTerm("");
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#95a5a6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Status</th>
                <th>Visited</th>
              </tr>
            </thead>
            <tbody>
              {appointments && appointments.length > 0 ? (
                appointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td>{`${appointment.firstName} ${appointment.lastName}`}</td>
                      <td>{appointment.appointment_date.substring(0, 16)}</td>
                      <td>{`${appointment.doctor.firstName} ${appointment.doctor.lastName}`}</td>
                      <td>{appointment.department}</td>
                      <td>
                        <select
                          className={
                            appointment.status === "Pending"
                              ? "value-pending"
                              : appointment.status === "Accepted"
                              ? "value-accepted"
                              : "value-rejected"
                          }
                          value={appointment.status}
                          onChange={(e) =>
                            handleUpdateStatus(appointment._id, e.target.value)
                          }
                        >
                          <option value="Pending" className="value-pending">
                            Pending
                          </option>
                          <option value="Accepted" className="value-accepted">
                            Accepted
                          </option>
                          <option value="Rejected" className="value-rejected">
                            Rejected
                          </option>
                        </select>
                      </td>
                      <td>{appointment.hasVisited === true ? <GoCheckCircleFill className="green"/> : <AiFillCloseCircle className="red"/>}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    No Appointments Found!
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {}
        </div>
      </section>
    </>
  );
};

export default Dashboard;
