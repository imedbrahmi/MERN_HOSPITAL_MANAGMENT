import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState([]);
  const { isAuthenticated, user } = useContext(Context);

  const [formData, setFormData] = useState({
    patientId: "",
    items: [{ description: "", quantity: 1, unitPrice: 0 }],
    tax: 0,
    discount: 0,
    notes: "",
  });

  useEffect(() => {
    if (isAuthenticated && (user?.role === "Receptionist" || user?.role === "Admin")) {
      fetchInvoices();
      fetchPatients();
    }
  }, [isAuthenticated, user]);

  const fetchInvoices = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:4000/api/v1/invoice",
        { withCredentials: true }
      );
      setInvoices(data.invoices || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch invoices");
      setInvoices([]);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:4000/api/v1/user/patients",
        { withCredentials: true }
      );
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unitPrice: 0 }],
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === "quantity" || field === "unitPrice" ? Number(value) : value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:4000/api/v1/invoice/create",
        formData,
        { withCredentials: true }
      );
      toast.success("Invoice created successfully");
      setShowForm(false);
      setFormData({
        patientId: "",
        items: [{ description: "", quantity: 1, unitPrice: 0 }],
        tax: 0,
        discount: 0,
        notes: "",
      });
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create invoice");
    }
  };

  const handleAddPayment = async (invoiceId) => {
    const amount = prompt("Enter payment amount:");
    const paymentMethod = prompt("Enter payment method (Cash, Credit Card, etc.):");
    if (!amount || !paymentMethod) return;

    try {
      await axios.put(
        `http://localhost:4000/api/v1/invoice/${invoiceId}/payment`,
        { amount: Number(amount), paymentMethod },
        { withCredentials: true }
      );
      toast.success("Payment added successfully");
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add payment");
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  if (user?.role !== "Receptionist" && user?.role !== "Admin") {
    return <Navigate to={"/"} />;
  }

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + (formData.tax || 0) - (formData.discount || 0);
  };

  return (
    <section className="page invoices">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>INVOICES</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4a90e2",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "Create Invoice"}
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
          <h3 style={{ fontSize: "28px", marginBottom: "30px", color: "#333", fontWeight: "600" }}>Create New Invoice</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "16px", fontWeight: "600", color: "#333" }}>Patient *</label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                style={{
                  padding: "15px 20px",
                  fontSize: "16px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  color: "#333",
                  cursor: "pointer",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#4a90e2"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              >
                <option value="">Select Patient</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName || ""} - {patient.email}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: "20px" }}>
              <h4 style={{ fontSize: "20px", marginBottom: "20px", color: "#333", fontWeight: "600" }}>Items</h4>
              {formData.items.map((item, index) => (
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
                    <strong style={{ fontSize: "18px", color: "#333" }}>Item {index + 1}</strong>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#e74c3c",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Description *</label>
                      <input
                        type="text"
                        placeholder="Enter item description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Quantity *</label>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          min="1"
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
                        <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Unit Price (TND) *</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                          min="0"
                          step="0.01"
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
                    <div style={{ 
                      padding: "12px 20px", 
                      backgroundColor: "#e8f4f8", 
                      borderRadius: "8px",
                      marginTop: "10px"
                    }}>
                      <p style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#2c3e50" }}>
                        Item Total: <span style={{ color: "#27ae60" }}>{(item.quantity * item.unitPrice).toFixed(2)} TND</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddItem}
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
                + Add Another Item
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Tax (TND)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) })}
                  min="0"
                  step="0.01"
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
                <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Discount (TND)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                  min="0"
                  step="0.01"
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

            <div style={{ 
              padding: "25px", 
              backgroundColor: "#f8f9fa", 
              borderRadius: "10px", 
              marginTop: "10px",
              border: "2px solid #e0e0e0"
            }}>
              <h4 style={{ fontSize: "18px", marginBottom: "15px", color: "#333", fontWeight: "600" }}>Summary</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px" }}>
                  <span style={{ color: "#666" }}>Subtotal:</span>
                  <strong style={{ color: "#333" }}>{calculateSubtotal().toFixed(2)} TND</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px" }}>
                  <span style={{ color: "#666" }}>Tax:</span>
                  <strong style={{ color: "#333" }}>{formData.tax.toFixed(2)} TND</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px" }}>
                  <span style={{ color: "#666" }}>Discount:</span>
                  <strong style={{ color: "#333" }}>{formData.discount.toFixed(2)} TND</strong>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  fontSize: "20px", 
                  paddingTop: "15px",
                  borderTop: "2px solid #ddd",
                  marginTop: "5px"
                }}>
                  <span style={{ color: "#333", fontWeight: "600" }}>Total:</span>
                  <strong style={{ color: "#27ae60", fontSize: "24px" }}>{calculateTotal().toFixed(2)} TND</strong>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "15px", fontWeight: "500", color: "#555" }}>Notes (optional)</label>
              <textarea
                placeholder="Add any additional notes or comments..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="4"
                style={{
                  padding: "15px 20px",
                  fontSize: "16px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  color: "#333",
                  fontFamily: "inherit",
                  resize: "vertical",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#4a90e2"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
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
              Create Invoice
            </button>
          </form>
        </div>
      )}

      <div className="banner" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {invoices.length > 0 ? (
          invoices.map((invoice) => {
            const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
            const remaining = invoice.total - totalPaid;
            return (
              <div
                key={invoice._id}
                className="card"
                style={{
                  backgroundColor: "#ffffff",
                  padding: "30px",
                  borderRadius: "15px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, marginBottom: "15px" }}>
                      Invoice #{invoice.invoiceNumber}
                    </h4>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Patient:</strong> {invoice.patientId?.firstName} {invoice.patientId?.lastName || ""}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Date:</strong> {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Total:</strong> {invoice.total.toFixed(2)} TND
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Status:</strong>{" "}
                      <span style={{
                        color: invoice.status === "Paid" ? "green" : invoice.status === "Partially Paid" ? "orange" : "red"
                      }}>
                        {invoice.status}
                      </span>
                    </p>
                    {totalPaid > 0 && (
                      <p style={{ margin: "5px 0" }}>
                        <strong>Paid:</strong> {totalPaid.toFixed(2)} TND | <strong>Remaining:</strong> {remaining.toFixed(2)} TND
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {remaining > 0 && (
                      <button
                        onClick={() => handleAddPayment(invoice._id)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#27ae60",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                      >
                        Add Payment
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          const response = await axios.get(
                            `http://localhost:4000/api/v1/invoice/${invoice._id}/pdf`,
                            { 
                              withCredentials: true,
                              responseType: 'blob'
                            }
                          );
                          const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          toast.error(error.response?.data?.message || "Failed to download PDF");
                        }
                      }}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#4a90e2",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <h3>No invoices found.</h3>
        )}
      </div>
    </section>
  );
};

export default Invoices;

