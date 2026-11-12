import { useEffect, useState } from "react";

import "../App.css";

const API = "http://127.0.0.1:8000/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchGroup, setSearchGroup] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 5;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API}/notifications`, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Unable to load notifications.");
        }

        const data = await response.json();

        const formattedNotifications = data.map((item) => {
          let details = {};

          try {
            details =
              typeof item.data === "string"
                ? JSON.parse(item.data)
                : item.data || {};
          } catch {
            details = {};
          }

          const alertType = details.alert_type || "";
          const percentage = Number(details.percentage || 0);

          let category = "warning";

          if (alertType === "FULL_ALERT" || percentage >= 100) {
            category = "completed";
          }
           
          return {
            id: item.id,
            groupName: details.group_name || "Unknown Group",
            alertType,
            percentage,
            category,
            createdAt: item.created_at,
          };
        });

        setNotifications(formattedNotifications);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);
   useEffect(() => {
  setCurrentPage(1);
}, [activeTab, searchGroup]);
  const totalNotifications = notifications.length;

  const nearFullGroups = notifications.filter(
    (item) => item.category === "warning"
  ).length;

  const completedGroups = notifications.filter(
    (item) => item.category === "completed"
  ).length;

  const filteredNotifications = notifications.filter((item) => {
  const matchesTab =
    activeTab === "all" ||
    (activeTab === "warning" && item.category === "warning") ||
    (activeTab === "completed" && item.category === "completed");

       const matchesSearch = item.groupName
      .toLowerCase()
      .includes(searchGroup.toLowerCase());

    return matchesTab && matchesSearch;
  });

// Pagination
const totalPages = Math.ceil(
  filteredNotifications.length / notificationsPerPage
);

const startIndex = (currentPage - 1) * notificationsPerPage;

const currentNotifications = filteredNotifications.slice(
  startIndex,
  startIndex + notificationsPerPage
);

    

  const getNotificationTitle = (item) => {
    return item.category === "completed"
      ? "Group Completed"
      : "Group Near Full";
  };

  const getNotificationMessage = (item) => {
    if (item.category === "completed") {
      return `The group "${item.groupName}" has reached its maximum capacity (100%).`;
    }

    return `The group "${item.groupName}" has reached ${item.percentage}% of its capacity.`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="content notifications-page">
      <div className="page-title">
        <h1>Notifications</h1>
        <p>
          View all system notifications about group status and participants.
        </p>
      </div>

      {loading ? (
        <p>Loading notifications...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <>
          <div className="notifications-stats">
  <div className="stat-card orange">
    <div className="stat-icon">🔔</div>
    <div>
      <strong>{totalNotifications}</strong>
      <h3>Total Notifications</h3>
      <p>All system notifications</p>
    </div>
  </div>

  <div className="stat-card yellow">
    <div className="stat-icon">⚠️</div>
    <div>
      <strong>{nearFullGroups}</strong>
      <h3>Groups Almost Complete</h3>
      <p>Groups at 80% or more</p>
    </div>
  </div>

  <div className="stat-card red">
    <div className="stat-icon">✓</div>
    <div>
      <strong>{completedGroups}</strong>
      <h3>Groups Completed</h3>
      <p>Groups at 100% capacity</p>
    </div>
  </div>
</div>

          <section className="panel notifications-panel">
            <div className="notifications-toolbar">
              <div className="notifications-tabs">
                <button
                  className={activeTab === "all" ? "active" : ""}
                  onClick={() => setActiveTab("all")}
                >
                  All Notifications
                </button>

                <button
                  className={activeTab === "warning" ? "active" : ""}
                  onClick={() => setActiveTab("warning")}
                >
                  Group Almost Complete
                </button>

                <button
                  className={activeTab === "completed" ? "active" : ""}
                  onClick={() => setActiveTab("completed")}
                >
                  Group Completed
                </button>
              </div>

              <input
                type="text"
                className="notification-search"
                placeholder="Search by group..."
                value={searchGroup}
                onChange={(e) => setSearchGroup(e.target.value)}
              />
            </div>

            <div className="notifications-list">
              {filteredNotifications.length > 0 ? (
               
currentNotifications.map((item) => (
  <div className="notification-item" key={item.id}>

    {/* LEFT SIDE */}
    <div className="notification-left">

      <div className={`notification-icon ${item.category}`}>
  {item.category === "completed" ? "✓" : <span className="warning-symbol">⚠️</span>}
</div>
  

      <div className="notification-details">
        <h3>{getNotificationTitle(item)}</h3>
        <p>{getNotificationMessage(item)}</p>
      </div>

    </div>

    {/* RIGHT SIDE */}
   <div className="notification-date">
  <span className="calendar-icon"></span>
  {formatDate(item.createdAt)}
</div>

  </div>
))

              ) : (
                <p className="empty-message">
                  No notifications found.
                </p>
              )}
            </div>
            {/* Notifications Pagination */}
<div className="notifications-pagination">
  <span>
    Showing {filteredNotifications.length === 0 ? 0 : startIndex + 1} to{" "}
    {Math.min(startIndex + notificationsPerPage, filteredNotifications.length)}
    {" "}of {filteredNotifications.length} notifications
  </span>

  <div className="pagination-buttons">
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((prev) => prev - 1)}
    >
      ‹
    </button>

    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
      <button
        key={page}
        className={currentPage === page ? "active" : ""}
        onClick={() => setCurrentPage(page)}
      >
        {page}
      </button>
    ))}

    <button
      disabled={currentPage === totalPages || totalPages === 0}
      onClick={() => setCurrentPage((prev) => prev + 1)}
    >
      ›
    </button>
  </div>
</div>
          </section>
        </>
      )}
    </div>
  );
}

export default Notifications;