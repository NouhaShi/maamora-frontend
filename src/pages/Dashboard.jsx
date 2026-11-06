import { useEffect, useState,useRef  } from "react";
import "../App.css";


import {
  Users,
  UserRound,
  Bell,
  Settings,
  Home,
  CalendarDays,
  Eye,
  Pencil,
  Trash2
} from "lucide-react";
const API = "http://127.0.0.1:8000/api";

function Dashboard() {
  const [dashboard, setDashboard] = useState({});
  const [groups, setGroups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [progressHistory, setProgressHistory] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const actionMenuRef = useRef(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [activePage, setActivePage] = useState("Dashboard");
  const [openActionMenu, setOpenActionMenu] = useState(null);
  // ADD GROUP MODAL
const [showAddGroup, setShowAddGroup] = useState(false);
const [groupName, setGroupName] = useState("");
const [groupCapacity, setGroupCapacity] = useState("");
const [addingGroup, setAddingGroup] = useState(false);
const [addGroupError, setAddGroupError] = useState("");
// VIEW GROUP MODAL
const [showViewGroup, setShowViewGroup] = useState(false);
const [selectedGroup, setSelectedGroup] = useState(null);
const [loadingGroup, setLoadingGroup] = useState(false);
const [viewGroupError, setViewGroupError] = useState("");
// EDIT GROUP MODAL
const [showEditGroup, setShowEditGroup] = useState(false);
const [editingGroup, setEditingGroup] = useState(null);
const [editGroupName, setEditGroupName] = useState("");
const [editGroupCapacity, setEditGroupCapacity] = useState("");
const [savingEditGroup, setSavingEditGroup] = useState(false);
const [editGroupError, setEditGroupError] = useState("");
// DELETE GROUP MODAL
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [showDeleteError, setShowDeleteError] = useState(false);
const [selectedDeleteGroup, setSelectedDeleteGroup] = useState(null);
const [deletingGroup, setDeletingGroup] = useState(false);

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

      fetch(`${API}/notifications?t=${Date.now()}`).then((res) => {
        if (!res.ok) throw new Error("Failed to load notifications");
        return res.json();
      }),
      // Progress History
    fetch(`${API}/dashboard/progress-history`).then((res) => {
     if (!res.ok) throw new Error("Failed to load progress history");
     return res.json();
     }),
    ])
      .then(([dashboardData, groupsData, notificationsData, progressHistoryData]) => {
        setDashboard(dashboardData || {});

        setGroups(
          Array.isArray(groupsData)
            ? groupsData
            : groupsData.groups || []
        );

        const notificationsList = Array.isArray(notificationsData)
         ? notificationsData
         : notificationsData.notifications || [];

         setNotifications(
          notificationsList.sort(
          (a, b) =>
           new Date(b.created_at) - new Date(a.created_at)
           )
           );
           setProgressHistory(
           Array.isArray(progressHistoryData)
           ? progressHistoryData
           : []
           );

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);
  useEffect(() => {
 const interval = setInterval(() => {
  console.log("🔄 Refreshing notifications...");

  fetch(`${API}/notifications`)
    .then((res) => {
      console.log("📡 Notifications response:", res.status);

      if (!res.ok) {
        throw new Error("Failed to refresh notifications");
      }

      return res.json();
    })
      .then((data) => {
      console.log("🔔 Notifications data:", data);

      const notificationsList = Array.isArray(data)
        ? data
        : data.notifications || [];

      setNotifications(
        notificationsList.sort(
          (a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        )
      );
    })
    .catch((err) => {
      console.error("❌ Notification refresh error:", err);
    });
                 }, 5000);

                return () => clearInterval(interval);
                }, []);

                
useEffect(() => {
  const handleClickOutside = (event) => {
    if (!event.target.closest(".action-menu-container")) {
      setOpenActionMenu(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

                
const handleAddGroup = async (e) => {
  e.preventDefault();

  setAddGroupError("");

  const name = groupName.trim();
  const capacity = Number(groupCapacity);

  if (!name) {
    setAddGroupError("Please enter a group name.");
    return;
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    setAddGroupError("Capacity must be a positive whole number.");
    return;
  }

  try {
    setAddingGroup(true);

    const response = await fetch(`${API}/groups`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        capacity: capacity,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Unable to create group."
      );
    }

    // Refresh groups and dashboard statistics
    const [groupsResponse, dashboardResponse] =
      await Promise.all([
        fetch(`${API}/groups`),
        fetch(`${API}/dashboard`),
      ]);

    if (!groupsResponse.ok || !dashboardResponse.ok) {
      throw new Error("Group created, but dashboard refresh failed. Please refresh the page.");
    }

    const groupsData = await groupsResponse.json();
    const dashboardData = await dashboardResponse.json();

    setGroups(
      Array.isArray(groupsData)
        ? groupsData
        : groupsData.groups || []
    );

    setDashboard(dashboardData || {});

    // Reset form
    setGroupName("");
    setGroupCapacity("");
    setShowAddGroup(false);

  } catch (error) {
    setAddGroupError(error.message);
  } finally {
    setAddingGroup(false);
  }
};

     const handleViewGroup = async (groupId) => {
  try {
    setLoadingGroup(true);
    setViewGroupError("");
    setSelectedGroup(null);
    setShowViewGroup(true);

    const response = await fetch(`${API}/groups/${groupId}`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load group details.");
    }

    setSelectedGroup(data);

  } catch (error) {
    setViewGroupError(error.message);
  } finally {
    setLoadingGroup(false);
  }
};                
     // HANDLE EDIT GROUP
const handleEditGroup = (group) => {
  setEditingGroup(group);

  setEditGroupName(
    group.name || group.product_name || ""
  );

  setEditGroupCapacity(
    group.capacity ?? group.target_participants ?? ""
  );

  setEditGroupError("");
  setShowEditGroup(true);
};
// OPEN DELETE GROUP MODAL
const handleOpenDeleteModal = (group) => {
  setSelectedDeleteGroup(group);

  const participants = Number(
    group.current_count ??
    group.current_participants ??
    group.participants_count ??
    0
  );

  if (participants > 0) {
    setShowDeleteError(true);
    setShowDeleteModal(false);
  } else {
    setShowDeleteError(false);
    setShowDeleteModal(true);
  }
};

// HANDLE DELETE GROUP
const handleDeleteGroup = async (groupId) => {
  try {
    setDeletingGroup(true);

    const response = await fetch(`${API}/groups/${groupId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 422) {
        setShowDeleteModal(false);
        setShowDeleteError(true);
        return;
      }

      throw new Error(result.message || "Failed to delete group.");
    }

    // Refresh groups and dashboard
    const [groupsResponse, dashboardResponse] =
      await Promise.all([
        fetch(`${API}/groups`),
        fetch(`${API}/dashboard`),
      ]);

    if (!groupsResponse.ok || !dashboardResponse.ok) {
      throw new Error("Group deleted, but dashboard refresh failed.");
    }

    const groupsData = await groupsResponse.json();
    const dashboardData = await dashboardResponse.json();

    setGroups(
      Array.isArray(groupsData)
        ? groupsData
        : groupsData.groups || []
    );

    setDashboard(dashboardData || {});

    // Close modal
    setShowDeleteModal(false);
    setSelectedDeleteGroup(null);

  } catch (error) {
    console.error("Delete group error:", error);
  } finally {
    setDeletingGroup(false);
  }
};


   // HANDLE UPDATE GROUP
const handleUpdateGroup = async (e) => {
  e.preventDefault();

  setEditGroupError("");

  const name = editGroupName.trim();
  const capacity = Number(editGroupCapacity);

  if (!name) {
    setEditGroupError("Please enter a group name.");
    return;
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    setEditGroupError("Capacity must be a positive whole number.");
    return;
  }

  try {
    setSavingEditGroup(true);

    const response = await fetch(
      `${API}/groups/${editingGroup.id}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          capacity,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Unable to update group."
      );
    }

    // Refresh groups and dashboard
    const [groupsResponse, dashboardResponse] =
      await Promise.all([
        fetch(`${API}/groups`),
        fetch(`${API}/dashboard`),
      ]);

    if (!groupsResponse.ok || !dashboardResponse.ok) {
      throw new Error(
        "Group updated, but refreshing the dashboard failed."
      );
    }

    const groupsData = await groupsResponse.json();
    const dashboardData = await dashboardResponse.json();

    setGroups(
      Array.isArray(groupsData)
        ? groupsData
        : groupsData.groups || []
    );

    setDashboard(dashboardData || {});

    setShowEditGroup(false);
    setEditingGroup(null);

  } catch (error) {
    setEditGroupError(error.message);
  } finally {
    setSavingEditGroup(false);
  }
};
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
                
<button
  type="button"
  className="add-button"
  onClick={() => {
    setOpenActionMenu(null);
    setShowAddGroup(true);
  }}
>
  + Add Group
</button>

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
                          
<td className="actions">
  <div className="action-menu-container" ref={actionMenuRef}>
    <button
      type="button"
      className="action-menu-trigger"
      onClick={() =>
        setOpenActionMenu(
          openActionMenu === (group.id || index)
            ? null
            : (group.id || index)
        )
      }
    >
      ⋮
    </button>

    {openActionMenu === (group.id || index) && (
      <div className="action-dropdown">

       
<button
  type="button"
  onClick={() => {
    console.log("VIEW CLICKED");
    console.log("GROUP ID:", group.id);
    setOpenActionMenu(null);
    handleViewGroup(group.id);
  }}
>
  <Eye size={15} />
  View
</button>


<button
  type="button"
  onClick={() => {
  setOpenActionMenu(null);
  handleEditGroup(group);
}}
>
  <Pencil size={15} />
  Edit
</button>

<button
  type="button"
  className="delete-action"
  onClick={() => {
    setOpenActionMenu(null);
    handleOpenDeleteModal(group);
  }}
>
  <Trash2 size={15} />
  Delete
</button>

      </div>
    )}
  </div>
</td>

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

      let title = "Group Near Full";
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
        <div className="notification-item" key={notification.id || index}>
          
          <div className={`notification-timeline ${typeClass}`}>
            <span className="timeline-dot"></span>

            <div className="notification-icon">
              {icon}
            </div>
          </div>

          <div className="notification-content">
            <strong>{title}</strong>

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
          
          {/* ADD GROUP MODAL */}
          {showAddGroup && (
            <div
              className="add-group-overlay"
              onClick={() => {
                if (!addingGroup) setShowAddGroup(false);
              }}
            >
              <div
                className="add-group-modal"
                onClick={(e) => e.stopPropagation()}
              >
                {/* MODAL HEADER */}
                <div className="add-group-header">
                  <div className="add-group-heading">
                    <div className="add-group-icon">
                      <Users size={27} />
                    </div>

                    <div>
                      <h2>Add New Group</h2>
                      <p>Create a new group and set its capacity.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="add-group-close"
                    onClick={() => setShowAddGroup(false)}
                    disabled={addingGroup}
                  >
                    ×
                  </button>
                </div>

                {/* MODAL FORM */}
                <form onSubmit={handleAddGroup}>
                  <div className="add-group-form">

                    <div className="form-field">
                      <label>
                        Group Name <span>*</span>
                      </label>

                      <input
                        type="text"
                        placeholder="Enter group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>
                        Maximum Capacity <span>*</span>
                      </label>

                      <input
                        type="number"
                        placeholder="Enter group capacity"
                        min="1"
                        step="1"
                        value={groupCapacity}
                        onChange={(e) => setGroupCapacity(e.target.value)}
                        required
                      />
                    </div>

                    {/* INITIAL PARTICIPANTS */}
                    <div className="group-default-row">
                      <div className="default-label">
                        <Users size={21} />
                        <span>Initial Participants</span>
                      </div>

                      <div className="default-value">0</div>
                    </div>

                    {/* DEFAULT STATUS */}
                    <div className="form-field">
                      <label>Status</label>

                      <div className="default-status">
                        <span className="status-dot"></span>
                        Low
                      </div>
                    </div>

                    {addGroupError && (
                      <p className="add-group-error" role="alert">
                        {addGroupError}
                      </p>
                    )}

                  </div>

                  {/* MODAL FOOTER */}
                  <div className="add-group-footer">
                    <button
                      type="button"
                      className="cancel-group-btn"
                      onClick={() => setShowAddGroup(false)}
                      disabled={addingGroup}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="submit-group-btn"
                      disabled={addingGroup}
                    >
                      {addingGroup ? "Adding..." : "Add Group"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        {/* VIEW GROUP MODAL */}
{showViewGroup && (
  <div className="add-group-overlay">
    <div className="modal-content view-group-modal">

      <div className="modal-header">
        <div>
          <h2>Group Details</h2>
          <p>View group information and current progress.</p>
        </div>

        <button
          type="button"
          className="close-modal"
          onClick={() => setShowViewGroup(false)}
        >
          ×
        </button>
      </div>

      <div className="view-group-body">

        {loadingGroup ? (
          <p>Loading group details...</p>
        ) : viewGroupError ? (
          <p className="form-error">{viewGroupError}</p>
        ) : selectedGroup ? (
          <>
            <div className="view-group-field">
              <label>Group Name</label>
              <p>{selectedGroup.name}</p>
            </div>

            <div className="view-group-field">
              <label>Group ID</label>
              <p>{selectedGroup.id}</p>
            </div>

            <div className="view-group-field">
              <label>Participants</label>
              <p>{selectedGroup.current_count}</p>
            </div>

            <div className="view-group-field">
              <label>Maximum Capacity</label>
              <p>{selectedGroup.capacity}</p>
            </div>

            <div className="view-group-field">
              <label>Progress</label>
              <p>{selectedGroup.percentage}%</p>
            </div>

            <div className="view-group-field">
              <label>Status</label>
              <p>{selectedGroup.status}</p>
            </div>
          </>
        ) : null}

      </div>

      <div className="modal-footer">
        <button
          type="button"
          onClick={() => setShowViewGroup(false)}
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}

{/* EDIT GROUP MODAL */}
{showEditGroup && editingGroup && (
  <div
    className="edit-group-overlay"
    onClick={() => {
      if (!savingEditGroup) setShowEditGroup(false);
    }}
  >
    <div
      className="edit-group-modal"
      onClick={(e) => e.stopPropagation()}
    >

      {/* HEADER */}
      <div className="edit-group-header">
        <div className="edit-group-heading">
          <div className="edit-group-icon">
            <Users size={27} />
          </div>

          <div>
            <h2>Edit Group</h2>
            <p>Update group information and capacity.</p>
          </div>
        </div>

        <button
          type="button"
          className="edit-group-close"
          disabled={savingEditGroup}
          onClick={() => setShowEditGroup(false)}
        >
          ×
        </button>
      </div>

      {/* FORM */}
      <form onSubmit={handleUpdateGroup}>

        <div className="edit-group-body">

          {editGroupError && (
  <div className="edit-error-notification" role="alert">
    <span className="edit-error-icon">!</span>

    <div>
      <strong>Unable to update group</strong>
      <p>{editGroupError}</p>
    </div>
  </div>
)}

          {/* GROUP NAME */}
          <div className="edit-form-field">
            <label>
              Group Name <span>*</span>
            </label>

            <input
              type="text"
              value={editGroupName}
              onChange={(e) =>
                setEditGroupName(e.target.value)
              }
              placeholder="Enter group name"
              required
            />
          </div>

          {/* CAPACITY */}
          <div className="edit-form-field">
            <label>
              Maximum Capacity <span>*</span>
            </label>

            <input
              type="number"
              min="1"
              value={editGroupCapacity}
              onChange={(e) =>
                setEditGroupCapacity(e.target.value)
              }
              required
            />
          </div>

          {/* CURRENT PARTICIPANTS */}
          <div className="edit-form-field">
            <label>Current Participants</label>

            <input
              type="number"
              value={
                editingGroup.current_count ??
                editingGroup.participants_count ??
                0
              }
              disabled
            />

            <small>
              Managed through participant records.
            </small>
          </div>

          {/* CURRENT STATUS */}
          <div className="edit-status-row">
            <label>Current Status</label>

            <span
              className={`edit-status-badge ${
                (() => {
                  const count = Number(
                    editingGroup.current_count ??
                    editingGroup.participants_count ?? 0
                  );

                  const capacity = Number(editGroupCapacity);
                  const percentage =
                    capacity > 0
                      ? (count / capacity) * 100
                      : 0;

                  return percentage >= 100
                    ? "full"
                    : percentage >= 80
                    ? "near-full"
                    : "low";
                })()
              }`}
            >
              {(() => {
                const count = Number(
                  editingGroup.current_count ??
                  editingGroup.participants_count ?? 0
                );

                const capacity = Number(editGroupCapacity);
                const percentage =
                  capacity > 0
                    ? (count / capacity) * 100
                    : 0;

                return percentage >= 100
                  ? "Completed"
                  : percentage >= 80
                  ? "Almost Complete"
                  : "Low";
              })()}
            </span>
          </div>

        </div>

        {/* FOOTER */}
        <div className="edit-group-footer">

          <button
            type="button"
            className="edit-cancel-btn"
            disabled={savingEditGroup}
            onClick={() => setShowEditGroup(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="edit-save-btn"
            disabled={savingEditGroup}
          >
            {savingEditGroup
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

      </form>
    </div>
  </div>
)}

{/* DELETE GROUP CONFIRMATION MODAL */}
{showDeleteModal && selectedDeleteGroup && (
  <div
    className="delete-modal-overlay"
    onClick={() => {
      if (!deletingGroup) setShowDeleteModal(false);
    }}
  >
    <div
      className="delete-modal-content"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="delete-modal-close"
        type="button"
        onClick={() => setShowDeleteModal(false)}
        disabled={deletingGroup}
      >
        ×
      </button>

      <div className="delete-modal-icon">
        <Trash2 size={30} />
      </div>

      <h2>Delete this group?</h2>

      <p className="delete-modal-message">
        This group has no participants. Are you sure
        you want to delete it?
      </p>

      <div className="delete-group-info">
        <div className="delete-group-icon">
          <Users size={23} />
        </div>

        <div className="delete-group-details">
          <strong>{selectedDeleteGroup.name}</strong>

          <div className="delete-group-meta">
            <span>
              <UserRound size={15} />
              {selectedDeleteGroup.current_count ?? 0} Participants
            </span>

            <span>
              {selectedDeleteGroup.capacity} Capacity
            </span>
          </div>
        </div>
      </div>

      <div className="delete-modal-actions">
        <button
          type="button"
          className="delete-cancel-btn"
          disabled={deletingGroup}
          onClick={() => setShowDeleteModal(false)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="delete-confirm-btn"
          disabled={deletingGroup}
          onClick={() => handleDeleteGroup(selectedDeleteGroup.id)}
        >
          <Trash2 size={16} />
          {deletingGroup ? "Deleting..." : "Delete Group"}
        </button>
      </div>
    </div>
  </div>
)}

{/* CANNOT DELETE GROUP MODAL */}
{showDeleteError && (
  <div className="delete-modal-overlay">
    <div className="delete-modal-content delete-error-modal">

      <button
        type="button"
        className="delete-modal-close"
        onClick={() => {
          setShowDeleteError(false);
          setSelectedDeleteGroup(null);
        }}
      >
        ×
      </button>

      <div className="delete-warning-icon">
        !
      </div>

      <h2>Cannot Delete Group</h2>

      <p className="delete-modal-message">
        This group contains registered participants and
        cannot be deleted.
      </p>

      <button
        type="button"
        className="delete-return-btn"
        onClick={() => {
          setShowDeleteError(false);
          setSelectedDeleteGroup(null);
        }}
      >
        ← &nbsp; Return to Groups
      </button>

    </div>
  </div>
)}

         </main>
  );
}

export default Dashboard;