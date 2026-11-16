import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarDays, UsersRound } from "lucide-react";
import "../App.css";

const API = "http://127.0.0.1:8000/api";

// Format notification dates in a readable relative format.
const formatTimeAgo = (date) => {
  if (!date) return "Just now";

  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
};

function Dashboard() {
  // Load cached dashboard data
  const [cachedDashboard] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("dashboard_cache") || "null"
      );
    } catch {
      return null;
    }
  });

  // States
  const [dashboard, setDashboard] = useState(cachedDashboard || {});
  const [groups, setGroups] = useState(
    cachedDashboard?.groups?.data || []
  );
  const [notifications, setNotifications] = useState(
    cachedDashboard?.notifications || []
  );

  const [loading, setLoading] = useState(!cachedDashboard);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [groupsPage, setGroupsPage] = useState(1);

  const [groupsPagination, setGroupsPagination] = useState({
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
    total: 0,
  });

  const groupsPerPage = 5;
  const navigate = useNavigate();
  // Search debounce
useEffect(() => {
  const timeoutId = setTimeout(() => {
    setDebouncedSearch(search);
    setGroupsPage(1);
  }, 400);

  return () => clearTimeout(timeoutId);
}, [search]);

  // ==============================
  // 2. LOAD DASHBOARD DATA
  // ==============================
   
  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      try {
        setError("");

        const params = new URLSearchParams({
          page: String(groupsPage),
          per_page: String(groupsPerPage),
        });

        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }

        if (statusFilter !== "All Status") {
          params.set("status", statusFilter);
        }

        const response = await fetch(
          `${API}/dashboard?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to load dashboard.");
        }

        const data = await response.json();

        setDashboard(data || {});
        setGroups(data.groups?.data || []);

        setGroupsPagination({
          current_page: data.groups?.current_page || 1,
          last_page: data.groups?.last_page || 1,
          from: data.groups?.from || 0,
          to: data.groups?.to || 0,
          total: data.groups?.total || 0,
        });

        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }

        // Save only the default dashboard view
        const isDefaultView =
          groupsPage === 1 &&
          !debouncedSearch.trim() &&
          statusFilter === "All Status";

        if (isDefaultView) {
          sessionStorage.setItem(
            "dashboard_cache",
            JSON.stringify(data)
          );
        }

      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      controller.abort();
    };

  }, [groupsPage, debouncedSearch, statusFilter]);


  // ==============================
  // 3. REFRESH NOTIFICATIONS
  // ==============================
   useEffect(() => {
  let isMounted = true;
  let timeoutId;

  const refreshNotifications = async () => {
    try {
      const response = await fetch(`${API}/dashboard/notifications`);

      if (!response.ok) {
        throw new Error("Failed to refresh notifications.");
      }

      const data = await response.json();

      const notificationList = Array.isArray(data)
        ? data
        : data.notifications || [];

      if (isMounted) {
        setNotifications(
          [...notificationList].sort(
            (a, b) =>
              new Date(b.created_at) - new Date(a.created_at)
          )
        );
      }
    } catch (err) {
      console.error("Notification refresh error:", err);
    } finally {
      if (isMounted) {
        timeoutId = setTimeout(refreshNotifications, 30000);
      }
    }
  };

  refreshNotifications();

  return () => {
    isMounted = false;
    clearTimeout(timeoutId);
  };
}, []);


  // Reset pagination when search or status filter changes.
  useEffect(() => {
    setGroupsPage(1);
  }, [search, statusFilter]);

  // 4. SERVER-SIDE PAGINATION

const currentGroups = groups;
const totalGroupsPages = groupsPagination.last_page;

  // ==============================
  // 5. CAPACITY STATISTICS
  // ==============================
  const totalCapacity = Number(dashboard.total_capacity || 0);
  const totalParticipants = Number(dashboard.total_participants || 0);

  const overallPercentage =
    dashboard.overall_fill_percentage !== undefined
      ? Math.round(dashboard.overall_fill_percentage)
      : totalCapacity > 0
      ? Math.round((totalParticipants / totalCapacity) * 100)
      : 0;

  const getGroupPercentage = (group) => {
    const capacity = Number(
      group.capacity || group.target_participants || 0
    );

    const count = Number(
      group.current_count || group.current_participants || 0
    );

    return capacity > 0 ? (count / capacity) * 100 : 0;
  };

  const inProgressGroups = Number(
  dashboard.in_progress_groups_count || 0
);

const almostCompleteGroups = Number(
  dashboard.almost_complete_groups_count || 0
);

const completedGroups = Number(
  dashboard.completed_groups_count || 0
);
    // ==============================
  // 6. RENDER DASHBOARD
  // ==============================
  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }
  const getVisiblePages = (current, total) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, "...", total];
    if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
  };
  return (
    <main className="content">
      {/* PAGE TITLE */}
      <div className="page-title">
        <div>
          <h1>Dashboard</h1>
          <h2 className="welcome">Welcome Back, Admin 👋</h2>
          <p className="description">
            Here is today's group overview.
          </p>
        </div>

        <div className="date">
          <CalendarDays className="date-icon" />
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>

               {/* STATISTICS CARDS */}
          <div className="stats-grid">
            <div className="stat-card orange">
              <div className="stat-icon">👥</div>
              <div>
                <strong>{dashboard.total_groups || 0}</strong>
                <h3>Groups</h3>
                <p>Total number of groups</p>
              </div>
            </div>

            <div className="stat-card blue">
              <div className="stat-icon">👤</div>
              <div>
                <strong>{dashboard.total_participants || 0}</strong>
                <h3>Participants</h3>
                <p>Total number of participants</p>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">📊</div>
              <div>
                <strong>{dashboard.total_capacity || 0}</strong>
                <h3>Total Capacity</h3>
                <p>Total available capacity</p>
              </div>
            </div>

            <div className="stat-card yellow">
              <div className="stat-icon">⚠️</div>
              <div>
                <strong>{almostCompleteGroups}</strong>
                <h3>Almost Complete</h3>
                <p>Groups at 80% or more</p>
              </div>
            </div>

            <div className="stat-card red">
              <div className="stat-icon">✓</div>
              <div>
                <strong>{dashboard.completed_groups_count || 0}</strong>
                <h3>Completed</h3>
                <p>Groups at 100% capacity</p>
              </div>
            </div>
          </div>

          {/* GROUPS + NOTIFICATIONS GRID */}
          <div className="dashboard-grid">

            {/* GROUP OVERVIEW */}
            <section className="panel groups-panel">
              <div className="panel-header">
                <h2>Group Overview</h2>
              </div>

              {/* SEARCH AND STATUS FILTER */}
              <div className="group-tools">
                <div className="group-search">
                  ⌕
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All Status</option>
                  <option>Low</option>
                  <option>In Progress</option>
                  <option>Almost Complete</option>
                  <option>Completed</option>
                </select>
              </div>

              {/* GROUPS TABLE */}
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Group Name</th>
                      <th>Participants</th>
                      <th>Capacity</th>
                      <th>Progress</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentGroups.length > 0 ? (
                      currentGroups.map((group, index) => {
                        const capacity = Number(
                          group.capacity ||
                          group.target_participants ||
                          0
                        );

                        const count = Number(
                          group.current_count ||
                          group.current_participants ||
                          0
                        );

                        const percentage =
                          capacity > 0
                            ? Math.round((count / capacity) * 100)
                            : 0;

                        return (
                          <tr key={group.id || index}>
                            <td>
                              <strong>
                                {group.name ||
                                  group.product_name ||
                                  "Group"}
                              </strong>
                            </td>

                            <td>{count}</td>
                            <td>{capacity}</td>

                            <td>
                              <div className="progress-cell">
                                <span>{percentage}%</span>

                                <div className="progress-bar">
                                  <div
                                    className={
                                      percentage >= 100
                                        ? "progress full-progress"
                                        : percentage >= 80
                                        ? "progress warning-progress"
                                        : percentage >= 50
                                        ? "progress normal-progress"
                                        : "progress low-progress"
                                    }
                                    style={{
                                      width: `${Math.min(
                                        percentage,
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td>
                              <span
                                className={`status ${
                                  percentage >= 100
                                    ? "completed"
                                    : percentage >= 80
                                    ? "almost-complete"
                                    : percentage >= 50
                                    ? "in-progress"
                                    : "low"
                                }`}
                              >
                                {percentage >= 100
                                  ? "Completed"
                                  : percentage >= 80
                                  ? "Almost Complete"
                                  : percentage >= 50
                                  ? "In Progress"
                                  : "Low"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="empty-state">
                          No groups found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* GROUPS PAGINATION */}
              <div className="groups-pagination">
  <span>
    Showing {groupsPagination.from || 0} to{" "}
    {groupsPagination.to || 0} of{" "}
    {groupsPagination.total} groups
  </span>

  <div className="pagination-controls">
    <button
      type="button"
      disabled={groupsPagination.current_page <= 1}
      onClick={() => setGroupsPage((page) => page - 1)}
    >
      ‹
    </button>

    {getVisiblePages(
      groupsPagination.current_page,
      groupsPagination.last_page
    ).map((page, idx) =>
      page === "..." ? (
        <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
          ...
        </span>
      ) : (
        <button
          type="button"
          key={page}
          className={
            groupsPagination.current_page === page ? "active" : ""
          }
          onClick={() => setGroupsPage(page)}
        >
          {page}
        </button>
      )
    )}

    <button
      type="button"
      disabled={
        groupsPagination.current_page >= groupsPagination.last_page
      }
      onClick={() => setGroupsPage((page) => page + 1)}
    >
      ›
    </button>
  </div>
</div>
            </section>
            {/* RECENT NOTIFICATIONS */}
            <section className="panel notifications-panel">
              <div className="panel-header">
                <h2>Recent Notifications</h2>

                <button
                  type="button"
                  className="view-all-btn"
                  onClick={() => navigate("/notifications")}
                >
                  View all →
                </button>
              </div>

              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification, index) => {
                    let data = {};

                    try {
                      data =
                        typeof notification.data === "string"
                          ? JSON.parse(notification.data)
                          : notification.data || {};
                    } catch (error) {
                      data = {};
                    }

                    const message =
                      data.message ||
                      notification.message ||
                      "A notification was received.";

                    const isFull =
                      data.alert_type === "FULL_ALERT" ||
                      Number(data.percentage) >= 100;

                    const isParticipant =
                      data.type === "participant" ||
                      notification.type === "participant";

                    let title = "Group Almost Complete";
                    let icon = "⚠️";
                    let typeClass = "warning";

                    if (isParticipant) {
                      title = "New Participant";
                      icon = "♙";
                      typeClass = "participant";
                    } else if (isFull) {
                      title = "Group Completed";
                      icon = "✓";
                      typeClass = "completed";
                    }

                    return (
                      <div
                        className="notification-item"
                        key={notification.id || index}
                      >
                        <div className={`notification-timeline ${typeClass}`}>
                          <span className="timeline-dot"></span>

                          <div className="notification-icon">
                            {icon}
                          </div>
                        </div>

                        <div className="notification-content">
                          <strong>{title}</strong>
                          <p>{message}</p>
                          <small>
                            {formatTimeAgo(notification.created_at)}
                          </small>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-notifications">
                    No notifications yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* BOTTOM SECTION */}
          <div
            className="bottom-dashboard-grid"
            style={{
              marginTop: "20px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "18px",
            }}
          >
            {/* CAPACITY OVERVIEW */}
            <section className="panel capacity-panel">
              <div className="panel-header">
                <h2>Capacity Overview</h2>
              </div>

              <div
                className="capacity-content"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                <div
                  className="capacity-circle"
                  style={{
                    position: "relative",
                    width: "90px",
                    height: "90px",
                    borderRadius: "50%",
                    background: `conic-gradient(#f27d2a ${overallPercentage}%, #e7ebef 0)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "50%",
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <strong>{overallPercentage}%</strong>
                  </div>
                </div>

                <div className="capacity-info">
                  <strong
                    style={{
                      fontSize: "18px",
                      display: "block",
                    }}
                  >
                    {totalParticipants} / {totalCapacity}
                  </strong>

                  <span
                    style={{
                      color: "#657895",
                      fontSize: "12px",
                    }}
                  >
                    Total Participants
                  </span>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#9aa7b8",
                      fontSize: "11px",
                    }}
                  >
                    {overallPercentage}% of total capacity
                  </p>
                </div>

                <div className="capacity-status">
                  <div className="capacity-status-item">
                    <span>🟡 In Progress:</span>
                    <strong>
                      {inProgressGroups}{" "}
                      <span>
                        {inProgressGroups === 1 ? "group" : "groups"}
                      </span>
                    </strong>
                  </div>

                  <div className="capacity-status-item">
                    <span>🟠 Almost Complete (≥ 80%):</span>
                    <strong>
                      {almostCompleteGroups}{" "}
                      <span>
                        {almostCompleteGroups === 1 ? "group" : "groups"}
                      </span>
                    </strong>
                  </div>

                  <div className="capacity-status-item">
                    <span>🟢 Completed (100%):</span>
                    <strong>
                      {completedGroups}{" "}
                      <span>
                        {completedGroups === 1 ? "group" : "groups"}
                      </span>
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            {/* QUICK ACTIONS */}
            <section className="panel quick-actions-panel">
              <div className="panel-header">
                <h2>Quick Actions</h2>
              </div>

              <div className="quick-actions">
                {/* Navigate to Groups page */}
                <button
                  type="button"
                  className="quick-action-card groups-action"
                  onClick={() => navigate("/groups")}
                >
                  <div className="quick-action-icon">
                    <UsersRound size={34} />
                  </div>

                  <div className="quick-action-text">
                    <strong>View Groups</strong>
                    <p>Check groups' status and progress</p>
                  </div>
                </button>

                {/* Navigate to Notifications page */}
                <button
                  type="button"
                  className="quick-action-card notifications-action"
                  onClick={() => navigate("/notifications")}
                >
                  <div className="quick-action-icon">
                    <Bell size={34} />
                  </div>

                  <div className="quick-action-text">
                    <strong>View Notifications</strong>
                    <p>Check alerts and updates</p>
                  </div>
                </button>
              </div>
            </section>
          </div>
        </main>
      );
}

export default Dashboard;