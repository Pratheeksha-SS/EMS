import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApplyLeave from "./ApplyLeave";
import HolidayCalendar from "./HolidayCalendar";

function Dashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showModal, setShowModal] = useState(false);

  // Check token on load
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    console.log("Token on dashboard load:", token ? "Present" : "Missing");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
    navigate("/");
  };

  const handleTabChange = (tab) => {
    console.log("Switching to tab:", tab);
    setActiveTab(tab);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>HRMS Dashboard 🎉</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => handleTabChange("dashboard")}
          style={{
            ...styles.tabButton,
            backgroundColor:
              activeTab === "dashboard" ? "#667eea" : "#f0f0f0",
            color: activeTab === "dashboard" ? "white" : "#333",
          }}
        >
          📊 Dashboard
        </button>

        <button
          onClick={() => handleTabChange("holidays")}
          style={{
            ...styles.tabButton,
            backgroundColor:
              activeTab === "holidays" ? "#667eea" : "#f0f0f0",
            color: activeTab === "holidays" ? "white" : "#333",
          }}
        >
          📅 Holidays
        </button>
      </div>

      {/* Content Area */}
      <div style={styles.content}>
        {activeTab === "dashboard" ? (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#4361ee",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Apply for Leave
            </button>

            <ApplyLeave
              show={showModal}
              onClose={() => setShowModal(false)}
              onSuccess={() => {
                alert("Leave applied successfully!");
                setShowModal(false);
              }}
            />
          </div>
        ) : (
          <HolidayCalendar />
        )}
      </div>
      <ApplyLeave />
      <button 
        onClick={() => setShowModal(true)}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#4361ee",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        Apply for Leave
      </button>

      <ApplyLeave 
        show={showModal} 
        onClose={() => setShowModal(false)} 
        onSuccess={() => {
          alert("Leave applied successfully!");
          setShowModal(false);
        }} 
      />
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    padding: "20px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "28px",
    color: "#333",
    margin: 0,
  },
  logoutButton: {
    padding: "10px 20px",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  tabButton: {
    padding: "12px 24px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    flex: 1,
    maxWidth: "200px",
  },
  content: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    minHeight: "500px",
  },
};

export default Dashboard;


