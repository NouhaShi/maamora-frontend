import { useEffect, useState } from "react";
import "./App.css";


import {
  Users,
  UserRound,
  Bell,
  Settings,
  Home,
  CalendarDays,
} from "lucide-react";
const API = "http://127.0.0.1:8000/api";

function App() {
  const [dashboard, setDashboard] = useState({});
  const [groups, setGroups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/dashboard`).then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      }),

      fetch(`${API}/groups`).then((res) => {
        if (!res.ok) throw new Error("Failed to load groups");
        return res.json();
      }),

      fetch(`${API}/notifications`).then((res) => {
        if (!res.ok) throw new Error("Failed to load notifications");
        return res.json();
      }),
    ])
      .then(([dashboardData, groupsData, notificationsData]) => {
        setDashboard(dashboardData || {});

        setGroups(
          Array.isArray(groupsData)
            ? groupsData
            : groupsData.groups || []
        );

        setNotifications(
          Array.isArray(notificationsData)
            ? notificationsData
            : notificationsData.notifications || []
        );

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  // =========================
  // GROUP FILTERING
  // =========================

  const filteredGroups = groups.filter((group) => {
    const capacity = Number(group.capacity || group.target_participants || 0);
    const count = Number(group.current_count || group.current_participants || 0);

    const percentage =
      capacity > 0 ? Math.round((count / capacity) * 100) : 0;

    let status = "In Progress";
    if (percentage >= 100) {
      status = "Completed";
    } else if (percentage >= 80) {
      status = "Near Full";
    }

    const groupName = group.name || group.product_name || "Unnamed Group";

    const matchesSearch = groupName
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All Status" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // =========================
  // CAPACITY DATA
  // =========================

  const totalCapacity = Number(dashboard.total_capacity || 0);
  const totalParticipants = Number(dashboard.total_participants || 0);

  const overallPercentage =
    dashboard.overall_fill_percentage !== undefined
      ? Math.round(dashboard.overall_fill_percentage)
      : totalCapacity > 0
      ? Math.round((totalParticipants / totalCapacity) * 100)
      : 0;

  const inProgressGroups = groups.filter((group) => {
    const capacity = Number(group.capacity || group.target_participants || 0);
    const count = Number(group.current_count || group.current_participants || 0);
    const percentage = capacity > 0 ? (count / capacity) * 100 : 0;
    return percentage < 80;
  }).length;

  const nearFullGroups = groups.filter((group) => {
    const capacity = Number(group.capacity || group.target_participants || 0);
    const count = Number(group.current_count || group.current_participants || 0);
    const percentage = capacity > 0 ? (count / capacity) * 100 : 0;
    return percentage >= 80 && percentage < 100;
  }).length;

  const fullGroups = groups.filter((group) => {
    const capacity = Number(group.capacity || group.target_participants || 0);
    const count = Number(group.current_count || group.current_participants || 0);
    const percentage = capacity > 0 ? (count / capacity) * 100 : 0;
    return percentage >= 100;
  }).length;

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
  <div>
    
            <div className="logo-title">Maamora</div>
            <div className="logo-subtitle">GROUP MONITOR</div>
          </div>
        </div>

        <nav className="navigation">
          <div className="nav-item active">
             <Home className="nav-icon" />
             <span>Dashboard</span>
          </div>
          <div className="nav-item">
            <Users className="nav-icon" />
            Groups
          </div>
          <div className="nav-item">
             <UserRound className="nav-icon" />
              <span>Participants</span>
          </div>
          <div className="nav-item">
            <Bell className="nav-icon" />
            Notifications
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="nav-item">
            <Settings className="nav-icon" />
            Settings
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="main-area">
        {/* TOP HEADER */}
        <header className="top-header">
          <div className="search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search groups, participants..."
            />
          </div>

          <div className="user-area">
            <div className="notification-bell">
              🔔
              <span className="notification-count">
                {notifications.length || 0}
              </span>
            </div>
            <div className="avatar">A</div>
            <div className="admin">
              <strong>Admin</strong>
              <span>⌄</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="content">
          {/* PAGE TITLE */}
          <div className="page-title">
            <div>
              <h1>Dashboard</h1>
              <h2 className="welcome">Welcom Back, Admin 👋</h2>
              <p className="description">Here is today's group overview.</p>
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
                <strong>
                  {dashboard.nearly_complete_groups_count || 0}
                </strong>
                <h3>Near Full</h3>
                <p>Groups at 80% or more</p>
              </div>
            </div>

            <div className="stat-card red">
              <div className="stat-icon">✓</div>
              <div>
                <strong>{dashboard.full_groups_count || 0}</strong>
                <h3>Full Group</h3>
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
                <button className="add-button">+ Add Group</button>
              </div>

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
                  <option>In Progress</option>
                  <option>Near Full</option>
                  <option>Completed</option>
                </select>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Group Name</th>
                      <th>Participants</th>
                      <th>Capacity</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map((group, index) => {
                      const capacity = Number(
                        group.capacity || group.target_participants || 0
                      );
                      const count = Number(
                        group.current_count || group.current_participants || 0
                      );

                      const percentage =
                        capacity > 0 ? Math.round((count / capacity) * 100) : 0;

                      let status = "In Progress";
                      if (percentage >= 100) {
                        status = "Completed";
                      } else if (percentage >= 80) {
                        status = "Near Full";
                      }

                      return (
                        <tr key={group.id || index}>
                          <td>
                            <strong>
                              {group.name || group.product_name || "Group"}
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
                                  : percentage >=50
                                  ? "progress normal-progress"
                                  : "progress low-progress"
                                  }
                                  style={{
                                    width: `${Math.min(percentage, 100)}%`,
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
                           {
                            percentage >= 100
                            ? "Completed"
                            : percentage >= 80
                            ? "Almost Complete"
                            : percentage >= 50
                            ? "In Progress"
                            : "Low"
                            }
                          </span>
                          </td>
                          <td className="actions">⋮</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* RECENT NOTIFICATIONS */}
            <section className="panel notifications-panel">
              <div className="panel-header">
                <h2>Recent Notifications</h2>
                <button className="view-all">View all →</button>
              </div>

              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification, index) => {
                    const data = notification.data || {};
                    const message =
                      data.message ||
                      notification.message ||
                      "A notification was received.";

                    const isFull = message.toLowerCase().includes("100") || message.toLowerCase().includes("completed");

                    return (
                      <div
                        className="notification-item"
                        key={notification.id || index}
                      >
                        <div
                          className={`notification-icon ${
                            isFull ? "red-icon" : "yellow-icon"
                          }`}
                        >
                          {isFull ? "✓" : "⚠️"}
                        </div>
                        <div>
                          <strong>
                            {isFull ? "Group Completed" : "Group Near Full"}
                          </strong>
                          <p>{message}</p>
                          <small>Recently</small>
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
          <div className="bottom-dashboard-grid" style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
            {/* CAPACITY OVERVIEW */}
            <section className="panel capacity-panel">
              <div className="panel-header">
                <h2>Capacity Overview</h2>
              </div>
              <div className="capacity-content" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div className="capacity-circle" style={{ position: "relative", width: "90px", height: "90px", borderRadius: "50%", background: `conic-gradient(#f27d2a ${overallPercentage}%, #e7ebef 0)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <strong>{overallPercentage}%</strong>
                  </div>
                </div>

                <div className="capacity-info">
                  <strong style={{ fontSize: "18px", display: "block" }}>
                    {totalParticipants} / {totalCapacity}
                  </strong>
                  <span style={{ color: "#657895", fontSize: "12px" }}>Total Participants</span>
                  <p style={{ margin: "4px 0 0", color: "#9aa7b8", fontSize: "11px" }}>
                    {overallPercentage}% of total capacity
                  </p>
                </div>

                <div className="capacity-status" style={{ marginLeft: "auto", fontSize: "12px" }}>
                  <div>🟢 In Progress: <strong>{inProgressGroups}</strong></div>
                  <div>🟠 Near Full (≥ 80%): <strong>{nearFullGroups}</strong></div>
                  <div>🔴 Full (100%): <strong>{fullGroups}</strong></div>
                </div>
              </div>
            </section>

            {/* QUICK ACTIONS */}
            <section className="panel quick-actions-panel">
              <div className="panel-header">
                <h2>Quick Actions</h2>
              </div>
              <div className="quick-actions" style={{ display: "flex", gap: "12px" }}>
                <button className="quick-action active-action" style={{ flex: 1, padding: "12px", border: "1px solid #f27d2a", borderRadius: "8px", background: "#fff0e4", cursor: "pointer", textAlign: "left" }}>
                  <strong style={{ color: "#f27d2a", display: "block" }}>+ Add Participant</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#657895" }}>Add a new participant to a group</p>
                </button>

                <button className="quick-action" style={{ flex: 1, padding: "12px", border: "1px solid #e3e8ee", borderRadius: "8px", background: "#fff", cursor: "pointer", textAlign: "left" }}>
                  <strong style={{ color: "#10213f", display: "block" }}>👥 Manage Groups</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#657895" }}>View and manage all groups</p>
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;