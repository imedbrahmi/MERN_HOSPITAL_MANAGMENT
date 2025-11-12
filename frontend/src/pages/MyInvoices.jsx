import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Hero from "../components/Hero";

const MyInvoices = () => {
  const { isAuthenticated, user } = useContext(Context);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "Patient") {
      fetchInvoices();
    }
  }, [isAuthenticated, user]);

  const fetchInvoices = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:4000/api/v1/invoice/patient/${user._id}`,
        { withCredentials: true }
      );
      setInvoices(data.invoices || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch invoices");
      setInvoices([]);
    }
  };

  const handlePay = async (invoiceId) => {
    const amount = prompt("Enter payment amount:");
    const paymentMethod = prompt("Enter payment method (Cash, Credit Card, etc.):");
    if (!amount || !paymentMethod) return;

    try {
      await axios.put(
        `http://localhost:4000/api/v1/invoice/${invoiceId}/payment`,
        { amount: Number(amount), paymentMethod },
        { withCredentials: true }
      );
      toast.success("Payment recorded successfully");
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record payment");
    }
  };

  if (!isAuthenticated || user?.role !== "Patient") {
    return <Navigate to={"/login"} />;
  }

  return (
    <>
      <Hero title={"My Invoices | MedFlow"} imageUrl={"/signin.png"} />
      <div className="container form-component">
        <h2>My Invoices</h2>
        {invoices.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "30px" }}>
            {invoices.map((invoice) => {
              const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
              const remaining = invoice.total - totalPaid;
              return (
                <div
                  key={invoice._id}
                  style={{
                    backgroundColor: "#ffffff",
                    padding: "25px",
                    borderRadius: "15px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, marginBottom: "15px" }}>Invoice #{invoice.invoiceNumber}</h4>
                      <p style={{ margin: "5px 0" }}>
                        <strong>Date:</strong> {new Date(invoice.createdAt).toLocaleDateString()}
                      </p>
                      <p style={{ margin: "5px 0" }}>
                        <strong>Total:</strong> {invoice.total.toFixed(2)} TND
                      </p>
                      <p style={{ margin: "5px 0" }}>
                        <strong>Status:</strong>{" "}
                        <span
                          style={{
                            color:
                              invoice.status === "Paid"
                                ? "green"
                                : invoice.status === "Partially Paid"
                                ? "orange"
                                : "red",
                          }}
                        >
                          {invoice.status}
                        </span>
                      </p>
                      {totalPaid > 0 && (
                        <p style={{ margin: "5px 0" }}>
                          <strong>Paid:</strong> {totalPaid.toFixed(2)} TND | <strong>Remaining:</strong>{" "}
                          {remaining.toFixed(2)} TND
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {remaining > 0 && (
                        <button
                          onClick={() => handlePay(invoice._id)}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#27ae60",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                        >
                          Pay Now
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
                          padding: "10px 20px",
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
            })}
          </div>
        ) : (
          <p style={{ marginTop: "30px", textAlign: "center" }}>No invoices found.</p>
        )}
      </div>
    </>
  );
};

export default MyInvoices;

