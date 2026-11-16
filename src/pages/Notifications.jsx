import { useEffect, useState, useRef } from "react";
import "../App.css";

const API = "http://127.0.0.1:8000/api";
const NOTIFICATIONS_PER_PAGE = 5;

const getVisiblePages = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

const formatNotificationItem = (item) => {
  let details = {};
  try {
    details = typeof item.data === "string" ? JSON.parse(item.data) : item.data || {};
  } catch {
    details = {};
  }

  const alertType = details.alert_type || "";
  const percentage = Number(details.percentage || 0);
  const category = alertType === "FULL_ALERT" || percentage >= 100 ? "completed" : "warning";

  return {
    id: item.id,
    groupName: details.group_name || "Unknown Group",
    alertType,
    percentage,
    category,
    createdAt: item.created_at,
  };
};

function Notifications() {
  const cachedData = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("notifications_cache") || "null");
    } catch {
      return null;
    }
  })();

  const [stats, setStats] = useState(cachedData?.stats || { total: 0, warning: 0, completed: 0 });
  const [pagination, setPagination] = useState(
    cachedData?.notifications || { data: [], current_page: 1, last_page: 1, total: 0, from: 0, to: 0 }
  );
  const [loading, setLoading] = useState(!cachedData);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("all");
  const [searchGroup, setSearchGroup] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const isInitialMount = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchGroup);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchGroup]);

  useEffect(() => {
    const controller = new AbortController();
    const isDefaultView = currentPage === 1 && activeTab === "all" && debouncedSearch === "";

    if (!isInitialMount.current) {
      setTableLoading(true);
    }

    const params = new URLSearchParams({
      page: String(currentPage),
      per_page: String(NOTIFICATIONS_PER_PAGE),
      tab: activeTab,
      search: debouncedSearch,
    });

    fetch(`${API}/notifications?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load notifications.");
        return res.json();
      })
      .then((data) => {
        if (data.stats) setStats(data.stats);
        if (data.notifications) {
          setPagination(data.notifications);
        }

        if (isDefaultView) {
          sessionStorage.setItem("notifications_cache", JSON.stringify(data));
        }

        setError("");
        isInitialMount.current = false;
      })
      .catch((err) => {
        if (err.name !== "AbortError" && !cachedData) {
          setError(err.message || "Something went wrong.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setTableLoading(false);
        }
      });

    return () => controller.abort();
  }, [currentPage, activeTab, debouncedSearch]);

  const currentNotifications = (pagination.data || []).map(formatNotificationItem);
  const totalPages = pagination.last_page || 1;

  const getNotificationTitle = (item) =>
    item.category === "completed" ? "Group Completed" : "Group Near Full";

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
        <p>View all system notifications about group status and participants.</p>
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
                <strong>{stats.total}</strong>
                <h3>Total Notifications</h3>
                <p>All system notifications</p>
              </div>
            </div>

            <div className="stat-card yellow">
              <div className="stat-icon">⚠️</div>
              <div>
                <strong>{stats.warning}</strong>
                <h3>Groups Almost Complete</h3>
                <p>Groups at 80% or more</p>
              </div>
            </div>

            <div className="stat-card red">
              <div className="stat-icon">✓</div>
              <div>
                <strong>{stats.completed}</strong>
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
                  onClick={() => {
                    setActiveTab("all");
                    setCurrentPage(1);
                  }}
                >
                  All Notifications
                </button>

                <button
                  className={activeTab === "warning" ? "active" : ""}
                  onClick={() => {
                    setActiveTab("warning");
                    setCurrentPage(1);
                  }}
                >
                  Group Almost Complete
                </button>

                <button
                  className={activeTab === "completed" ? "active" : ""}
                  onClick={() => {
                    setActiveTab("completed");
                    setCurrentPage(1);
                  }}
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

            <div className="notifications-list" style={{ opacity: tableLoading ? 0.6 : 1 }}>
              {currentNotifications.length > 0 ? (
                currentNotifications.map((item) => (
                  <div className="notification-item" key={item.id}>
                    <div className="notification-left">
                      <div className={`notification-icon ${item.category}`}>
                        {item.category === "completed" ? "✓" : <span className="warning-symbol">⚠️</span>}
                      </div>

                      <div className="notification-details">
                        <h3>{getNotificationTitle(item)}</h3>
                        <p>{getNotificationMessage(item)}</p>
                      </div>
                    </div>

                    <div className="notification-date">
                      <span className="calendar-icon"></span>
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message">No notifications found.</p>
              )}
            </div>

            <div className="notifications-pagination">
              <span>
                Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total || 0}{" "}
                notifications
              </span>

              <div className="pagination-buttons">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  ‹
                </button>

                {getVisiblePages(currentPage, totalPages).map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={page}
                      className={currentPage === page ? "active" : ""}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                )}

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