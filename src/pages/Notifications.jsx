
import { useEffect, useState } from "react";
import "../App.css";

const API = "http://127.0.0.1:8000/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchGroup, setSearchGroup] = useState("");

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
            <div className="notification-stat-card">
  <div className="notification-stat-icon orange">🔔</div>
  <div>
    <h2>{totalNotifications}</h2>
    <p>Total Notifications</p>
  </div>
</div>

            <div className="notification-stat-card">
              <div className="notification-stat-icon peach">⚠</div>
              <div>
                <h2>{nearFullGroups}</h2>
                <p>Groups Near Full (≥ 80%)</p>
              </div>
            </div>

            <div className="notification-stat-card">
              <div className="notification-stat-icon green">✓</div>
              <div>
                <h2>{completedGroups}</h2>
                <p>Groups Completed (100%)</p>
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
                  Group Near Full
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
               
filteredNotifications.map((item) => (
  <div className="notification-item" key={item.id}>

    {/* LEFT SIDE */}
    <div className="notification-left">

      <div
        className={`notification-icon ${
          item.category === "completed"
            ? "completed"
            : "warning"
        }`}
      >
        {item.category === "completed" ? "✓" : "⚠"}
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
          </section>
        </>
      )}
    </div>
  );
}

export default Notifications;
