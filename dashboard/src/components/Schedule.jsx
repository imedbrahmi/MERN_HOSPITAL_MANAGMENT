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
    selectedDays: [],
    selectedDates: [], // Nouvelles dates spécifiques
    timeSlots: [{ startTime: "", endTime: "" }],
    duration: 30,
    isAvailable: true,
    useCalendar: false, // Toggle entre jours de la semaine et calendrier
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

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  const handleAddTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { startTime: "", endTime: "" }]
    }));
  };

  const handleRemoveTimeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const handleTimeSlotChange = (index, field, value) => {
    const newTimeSlots = [...formData.timeSlots];
    newTimeSlots[index][field] = value;
    setFormData({ ...formData, timeSlots: newTimeSlots });
  };

  const handleDateToggle = (date) => {
    setFormData(prev => ({
      ...prev,
      selectedDates: prev.selectedDates.includes(date)
        ? prev.selectedDates.filter(d => d !== date)
        : [...prev.selectedDates, date]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.useCalendar) {
      if (formData.selectedDates.length === 0) {
        toast.error("Please select at least one date");
        return;
      }
    } else {
      if (formData.selectedDays.length === 0) {
        toast.error("Please select at least one day");
        return;
      }
    }
    
    if (formData.timeSlots.some(slot => !slot.startTime || !slot.endTime)) {
      toast.error("Please fill all time slots");
      return;
    }

    try {
      if (editingSchedule) {
        // Update single schedule
        const updateData = {
          startTime: formData.timeSlots[0].startTime,
          endTime: formData.timeSlots[0].endTime,
          duration: formData.duration,
          isAvailable: formData.isAvailable,
        };
        
        if (formData.useCalendar && formData.selectedDates.length > 0) {
          updateData.date = formData.selectedDates[0];
        } else if (formData.selectedDays.length > 0) {
          updateData.dayOfWeek = formData.selectedDays[0];
        }
        
        await axios.put(
          `http://localhost:4000/api/v1/schedule/${editingSchedule._id}`,
          updateData,
          { withCredentials: true }
        );
        toast.success("Schedule updated successfully");
      } else {
        // Create multiple schedules
        const schedulesToCreate = [];
        
        if (formData.useCalendar) {
          // Utiliser les dates spécifiques du calendrier
          formData.selectedDates.forEach(date => {
            formData.timeSlots.forEach(slot => {
              schedulesToCreate.push({
                date: date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                duration: formData.duration,
                isAvailable: formData.isAvailable,
              });
            });
          });
        } else {
          // Utiliser les jours de la semaine
          formData.selectedDays.forEach(day => {
            formData.timeSlots.forEach(slot => {
              schedulesToCreate.push({
                dayOfWeek: day,
                startTime: slot.startTime,
                endTime: slot.endTime,
                duration: formData.duration,
                isAvailable: formData.isAvailable,
              });
            });
          });
        }

        // Créer tous les schedules avec gestion des erreurs
        const results = await Promise.allSettled(
          schedulesToCreate.map(scheduleData =>
            axios.post(
              "http://localhost:4000/api/v1/schedule/create",
              scheduleData,
              { withCredentials: true }
            )
          )
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        if (successful > 0) {
          toast.success(`${successful} schedule(s) created successfully`);
        }
        if (failed > 0) {
          toast.warning(`${failed} schedule(s) could not be created (may already exist)`);
        }
      }
      
      setShowForm(false);
      setEditingSchedule(null);
      setFormData({
        selectedDays: [],
        selectedDates: [],
        timeSlots: [{ startTime: "", endTime: "" }],
        duration: 30,
        isAvailable: true,
        useCalendar: false,
      });
      fetchSchedules();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save schedule");
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    const useCalendar = !!schedule.date;
    setFormData({
      selectedDays: schedule.date ? [] : [schedule.dayOfWeek],
      selectedDates: schedule.date ? [new Date(schedule.date).toISOString().split('T')[0]] : [],
      timeSlots: [{ startTime: schedule.startTime, endTime: schedule.endTime }],
      duration: schedule.duration,
      isAvailable: schedule.isAvailable,
      useCalendar: useCalendar,
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
              selectedDays: [],
              selectedDates: [],
              timeSlots: [{ startTime: "", endTime: "" }],
              duration: 30,
              isAvailable: true,
              useCalendar: false,
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
            padding: "40px",
            borderRadius: "15px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            marginBottom: "30px",
          }}
        >
          <h3 style={{ fontSize: "28px", marginBottom: "30px", color: "#333", fontWeight: "600" }}>
            {editingSchedule ? "Edit Schedule" : "Add New Schedule"}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            {/* Toggle entre jours de la semaine et calendrier */}
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
              <label style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "10px",
                fontSize: "16px",
                fontWeight: "500",
                color: "#555",
                cursor: "pointer"
              }}>
                <input
                  type="checkbox"
                  checked={formData.useCalendar}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      useCalendar: e.target.checked,
                      selectedDays: [],
                      selectedDates: []
                    });
                  }}
                  style={{
                    width: "20px",
                    height: "20px",
                    cursor: "pointer",
                  }}
                />
                Use Calendar (Select Specific Dates)
              </label>
            </div>

            {/* Calendrier pour sélectionner des dates spécifiques */}
            {formData.useCalendar ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "10px" }}>
                  Select Dates * (Multiple selection)
                </label>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", 
                  gap: "10px",
                  marginBottom: "20px"
                }}>
                  {/* Générer les dates pour les 30 prochains jours */}
                  {Array.from({ length: 30 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = date.getDate();
                    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                    
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => handleDateToggle(dateStr)}
                        style={{
                          padding: "12px 16px",
                          backgroundColor: formData.selectedDates.includes(dateStr) ? "#4a90e2" : "#fff",
                          color: formData.selectedDates.includes(dateStr) ? "#fff" : "#333",
                          border: `2px solid ${formData.selectedDates.includes(dateStr) ? "#4a90e2" : "#ddd"}`,
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                          transition: "all 0.3s",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) => {
                          if (!formData.selectedDates.includes(dateStr)) {
                            e.target.style.backgroundColor = "#e8f4f8";
                            e.target.style.borderColor = "#4a90e2";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!formData.selectedDates.includes(dateStr)) {
                            e.target.style.backgroundColor = "#fff";
                            e.target.style.borderColor = "#ddd";
                          }
                        }}
                      >
                        <span style={{ fontSize: "12px", opacity: 0.8 }}>{dayName}</span>
                        <span style={{ fontSize: "18px", fontWeight: "600" }}>{dayNum}</span>
                        <span style={{ fontSize: "11px", opacity: 0.7 }}>{monthName}</span>
                      </button>
                    );
                  })}
                </div>
                {formData.selectedDates.length > 0 && (
                  <p style={{ marginTop: "10px", color: "#27ae60", fontWeight: "600", fontSize: "14px" }}>
                    Selected: {formData.selectedDates.length} date(s)
                  </p>
                )}
              </div>
            ) : (
              /* Multi-select Days */
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "10px" }}>
                  Select Days * (Multiple selection)
                </label>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", 
                gap: "10px" 
              }}>
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    style={{
                      padding: "12px 16px",
                      backgroundColor: formData.selectedDays.includes(day) ? "#4a90e2" : "#fff",
                      color: formData.selectedDays.includes(day) ? "#fff" : "#333",
                      border: `2px solid ${formData.selectedDays.includes(day) ? "#4a90e2" : "#ddd"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      if (!formData.selectedDays.includes(day)) {
                        e.target.style.backgroundColor = "#e8f4f8";
                        e.target.style.borderColor = "#4a90e2";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!formData.selectedDays.includes(day)) {
                        e.target.style.backgroundColor = "#fff";
                        e.target.style.borderColor = "#ddd";
                      }
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {formData.selectedDays.length > 0 && (
                <p style={{ marginTop: "10px", color: "#27ae60", fontWeight: "600", fontSize: "14px" }}>
                  Selected: {formData.selectedDays.join(", ")}
                </p>
              )}
              </div>
            )}

            {/* Multiple Time Slots */}
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ fontSize: "20px", marginBottom: "20px", color: "#333", fontWeight: "600" }}>
                Time Slots * (Multiple slots allowed)
              </h4>
              {formData.timeSlots.map((slot, index) => (
                <div 
                  key={index} 
                  style={{ 
                    border: "2px solid #e0e0e0", 
                    padding: "25px", 
                    marginBottom: "20px", 
                    borderRadius: "10px",
                    backgroundColor: "#fafafa"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <strong style={{ fontSize: "18px", color: "#333" }}>Time Slot {index + 1}</strong>
                    {formData.timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeSlot(index)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#e74c3c",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                          transition: "background-color 0.3s",
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#c0392b"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "#e74c3c"}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Start Time *</label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => handleTimeSlotChange(index, "startTime", e.target.value)}
                        required
                        style={{
                          padding: "15px 20px",
                          fontSize: "16px",
                          border: "2px solid #ddd",
                          borderRadius: "8px",
                          backgroundColor: "#fff",
                          color: "#333",
                          transition: "border-color 0.3s",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#4a90e2"}
                        onBlur={(e) => e.target.style.borderColor = "#ddd"}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>End Time *</label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => handleTimeSlotChange(index, "endTime", e.target.value)}
                        required
                        style={{
                          padding: "15px 20px",
                          fontSize: "16px",
                          border: "2px solid #ddd",
                          borderRadius: "8px",
                          backgroundColor: "#fff",
                          color: "#333",
                          transition: "border-color 0.3s",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#4a90e2"}
                        onBlur={(e) => e.target.style.borderColor = "#ddd"}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddTimeSlot}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#27ae60",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "500",
                  marginTop: "10px",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#229954"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#27ae60"}
              >
                + Add Another Time Slot
              </button>
            </div>

            {/* Duration */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Duration (minutes) *</label>
                <input
                  type="number"
                  placeholder="30"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                  min="15"
                  max="120"
                  required
                  style={{
                    padding: "15px 20px",
                    fontSize: "16px",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                    color: "#333",
                    transition: "border-color 0.3s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4a90e2"}
                  onBlur={(e) => e.target.style.borderColor = "#ddd"}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px",
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "#555",
                  cursor: "pointer"
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    style={{
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                    }}
                  />
                  Available
                </label>
              </div>
            </div>

            <button 
              type="submit"
              style={{
                padding: "16px 32px",
                backgroundColor: "#4a90e2",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: "600",
                marginTop: "10px",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#357abd"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#4a90e2"}
            >
              {editingSchedule ? "Update Schedule" : "Create Schedule(s)"}
            </button>
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
                <h4 style={{ margin: 0, marginBottom: "10px" }}>
                  {schedule.date 
                    ? new Date(schedule.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : schedule.dayOfWeek
                  }
                </h4>
                {schedule.date && (
                  <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
                    <strong>Date:</strong> {new Date(schedule.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
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

