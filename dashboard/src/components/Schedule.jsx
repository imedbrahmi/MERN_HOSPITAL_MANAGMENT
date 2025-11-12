import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const { isAuthenticated, user } = useContext(Context);

  const [formData, setFormData] = useState({
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    duration: 30,
    isAvailable: true,
  });

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    if (isAuthenticated && user?.role === "Doctor") {
      fetchSchedules();
    }
  }, [isAuthenticated, user]);

  const fetchSchedules = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:4000/api/v1/schedule/my-schedule",
        { withCredentials: true }
      );
      setSchedules(data.schedules || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch schedule");
      setSchedules([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        // Update
        await axios.put(
          `http://localhost:4000/api/v1/schedule/${editingSchedule._id}`,
          formData,
          { withCredentials: true }
        );
        toast.success("Schedule updated successfully");
      } else {
        // Create
        await axios.post(
          "http://localhost:4000/api/v1/schedule/create",
          formData,
          { withCredentials: true }
        );
        toast.success("Schedule created successfully");
      }
      setShowForm(false);
      setEditingSchedule(null);
      setFormData({
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        duration: 30,
        isAvailable: true,
      });
      fetchSchedules();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save schedule");
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      duration: schedule.duration,
      isAvailable: schedule.isAvailable,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await axios.delete(
        `http://localhost:4000/api/v1/schedule/${id}`,
        { withCredentials: true }
      );
      toast.success("Schedule deleted successfully");
      fetchSchedules();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete schedule");
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  if (user?.role !== "Doctor") {
    return <Navigate to={"/"} />;
  }

  return (
    <section className="page schedule">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>MY SCHEDULE</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingSchedule(null);
            setFormData({
              dayOfWeek: "",
              startTime: "",
              endTime: "",
              duration: 30,
              isAvailable: true,
            });
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4a90e2",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "Add Schedule"}
        </button>
      </div>

      {showForm && (
        <div
          className="card"
          style={{
            backgroundColor: "#ffffff",
            padding: "30px",
            borderRadius: "15px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            marginBottom: "30px",
          }}
        >
          <h3>{editingSchedule ? "Edit Schedule" : "Add New Schedule"}</h3>
          <form onSubmit={handleSubmit} className="add-admin-form">
            <select
              value={formData.dayOfWeek}
              onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
              required
            >
              <option value="">Select Day</option>
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>

            <input
              type="time"
              placeholder="Start Time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />

            <input
              type="time"
              placeholder="End Time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />

            <input
              type="number"
              placeholder="Duration (minutes)"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              min="15"
              max="120"
              required
            />

            <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              />
              Available
            </label>

            <button type="submit">{editingSchedule ? "Update" : "Create"}</button>
          </form>
        </div>
      )}

      <div className="banner" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {schedules.length > 0 ? (
          schedules.map((schedule) => (
            <div
              key={schedule._id}
              className="card"
              style={{
                backgroundColor: "#ffffff",
                padding: "30px",
                borderRadius: "15px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h4 style={{ margin: 0, marginBottom: "10px" }}>{schedule.dayOfWeek}</h4>
                <p style={{ margin: "5px 0" }}>
                  <strong>Time:</strong> {schedule.startTime} - {schedule.endTime}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Duration:</strong> {schedule.duration} minutes
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Status:</strong>{" "}
                  <span style={{ color: schedule.isAvailable ? "green" : "red" }}>
                    {schedule.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => handleEdit(schedule)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#4a90e2",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(schedule._id)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <h3>No schedule found. Add your availability!</h3>
        )}
      </div>
    </section>
  );
};

export default Schedule;

