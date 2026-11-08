import { useEffect, useState } from "react";
import { Users, Hourglass, AlertTriangle, Check } from "lucide-react";
import {
  UsersRound,
  Plus,
} from "lucide-react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import "../App.css";

const API = "http://127.0.0.1:8000/api";

function Groups() {
  const [groups, setGroups] = useState([]);
  const [progressHistory, setProgressHistory] = useState([]);
  const [dateRange, setDateRange] = useState("7");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const totalGroups = groups.length;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showAddGroup, setShowAddGroup] = useState(false);
const [addingGroup, setAddingGroup] = useState(false);
const [groupName, setGroupName] = useState("");
const [groupCapacity, setGroupCapacity] = useState("");
const [addGroupError, setAddGroupError] = useState("");
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

const [currentPage, setCurrentPage] = useState(1);
const groupsPerPage = 5;

  const filteredGroups = groups.filter((group) => {
  const matchesSearch = (group.name || "")
    .toLowerCase()
    .includes(search.toLowerCase());

   const matchesStatus =
    statusFilter === "All Status" ||
    group.status === statusFilter;

  return matchesSearch && matchesStatus;
  });
  const totalPages = Math.ceil(filteredGroups.length / groupsPerPage);

const startIndex = (currentPage - 1) * groupsPerPage;

const currentGroups = filteredGroups.slice(
  startIndex,
  startIndex + groupsPerPage
);

const completedGroups = groups.filter(
  (group) => Number(group.percentage) >= 100
).length;

const nearFullGroups = groups.filter(
  (group) =>
    Number(group.percentage) >= 80 &&
    Number(group.percentage) < 100
).length;

const inProgressGroups = groups.filter(
  (group) => Number(group.percentage) < 80
).length;
const handleAddGroup = async (e) => {
  e.preventDefault();

  setAddGroupError("");

  if (!groupName.trim() || !groupCapacity || Number(groupCapacity) <= 0) {
    setAddGroupError("Please enter a valid group name and capacity.");
    return;
  }

  try {
    setAddingGroup(true);

    const response = await fetch(`${API}/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: groupName.trim(),
        capacity: Number(groupCapacity),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to add group.");
    }

    // Refresh groups and dashboard statistics
    const [groupsResponse, dashboardResponse] = await Promise.all([
      fetch(`${API}/groups`),
      fetch(`${API}/dashboard`),
    ]);

    if (!groupsResponse.ok || !dashboardResponse.ok) {
      throw new Error("Group added, but refreshing data failed.");
    }

    const groupsData = await groupsResponse.json();
    const dashboardData = await dashboardResponse.json();

    setGroups(
      Array.isArray(groupsData) ? groupsData : groupsData.groups || []
    );

    setDashboard(dashboardData);

    setShowAddGroup(false);
    setGroupName("");
    setGroupCapacity("");
    setAddGroupError("");
  } catch (error) {
    console.error("Add group error:", error);
    setAddGroupError(error.message);
  } finally {
    setAddingGroup(false);
  }
};
const handleEditGroup = (group) => {
  setEditingGroup(group);
  setEditGroupName(group.name);
  setEditGroupCapacity(group.capacity);
  setEditGroupError("");
  setShowEditGroup(true);
};
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

    // Refresh groups
    const groupsResponse = await fetch(`${API}/groups`);

    if (!groupsResponse.ok) {
      throw new Error("Group deleted, but refreshing groups failed.");
    }

    const groupsData = await groupsResponse.json();

    setGroups(
      Array.isArray(groupsData)
        ? groupsData
        : groupsData.groups || []
    );

    // Close modal and clear selection
    setShowDeleteModal(false);
    setSelectedDeleteGroup(null);

    // Close details panel if the deleted group was selected
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(null);
    }

  } catch (error) {
    console.error("Delete group error:", error);
  } finally {
    setDeletingGroup(false);
  }
};
const handleUpdateGroup = async (e) => {
  e.preventDefault();

  setEditGroupError("");

  if (!editGroupName.trim() || !editGroupCapacity || Number(editGroupCapacity) <= 0) {
    setEditGroupError("Please enter a valid group name and capacity.");
    return;
  }

  const currentParticipants = Number(
    editingGroup.current_count ??
    editingGroup.participants_count ??
    0
  );

  if (Number(editGroupCapacity) < currentParticipants) {
    setEditGroupError(
      "Capacity cannot be lower than the current number of participants."
    );
    return;
  }

  try {
    setSavingEditGroup(true);

    const response = await fetch(`${API}/groups/${editingGroup.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: editGroupName.trim(),
        capacity: Number(editGroupCapacity),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to update group."
      );
    }

    const groupsResponse = await fetch(`${API}/groups`);

    if (!groupsResponse.ok) {
      throw new Error("Group updated, but refreshing data failed.");
    }

    const groupsData = await groupsResponse.json();

    setGroups(
      Array.isArray(groupsData)
        ? groupsData
        : groupsData.groups || []
    );

    setShowEditGroup(false);
    setEditingGroup(null);
    setEditGroupName("");
    setEditGroupCapacity("");
    setEditGroupError("");

  } catch (error) {
    console.error("Update group error:", error);
    setEditGroupError(error.message);
  } finally {
    setSavingEditGroup(false);
  }
};

  useEffect(() => {
    fetch(`${API}/groups`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load groups");
        }
        return res.json();
      })
      .then((data) => {
        setGroups(
          Array.isArray(data) ? data : data.groups || []
        );
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load groups. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  useEffect(() => {
  fetch(`${API}/dashboard/progress-history`)
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to load progress history");
      }
      return res.json();
    })
    .then((data) => {
      setProgressHistory(Array.isArray(data) ? data : []);
    })
    .catch((err) => {
      console.error("Progress History Error:", err);
    });
}, []);
const selectedGroupHistory = selectedGroup
  ? progressHistory
      .filter((item) =>
        String(item.group_id) === String(selectedGroup.id)
      )
      .filter((item) => {
        const date = new Date(item.created_at);
        const cutoff = new Date();

        cutoff.setDate(
          cutoff.getDate() - Number(dateRange)
        );

        return date >= cutoff;
      })
      .sort(
        (a, b) =>
          new Date(a.created_at) - new Date(b.created_at)
      )
  : [];

const chartPoints = selectedGroupHistory
  .map((item, index) => {
    const x =
      selectedGroupHistory.length > 1
        ? 40 + (index * 520) / (selectedGroupHistory.length - 1)
        : 300;

    const percentage = Math.min(
      Math.max(Number(item.percentage) || 0, 0),
      100
    );

    const y = 180 - percentage * 1.5;

    return `${x},${y}`;
  })
  .join(" ");

  return (
    <main className="content">
      <div className="page-title">
        <div>
          <h1>Groups Management</h1>
          <p className="description">
            View, add, edit and manage groups.
          </p>
        </div>
      </div>
      
      {/* GROUP STATISTICS */}
      
<div className="groups-stats-grid">

  <div className="stat-card orange">
    <div className="stat-icon">👥</div>
    <div>
      <strong>{totalGroups}</strong>
      <h3>Total Groups</h3>
    </div>
  </div>

  <div className="stat-card purple">
    <div className="stat-icon">⌛</div>
    <div>
      <strong>{inProgressGroups}</strong>
      <h3>In Progress</h3>
      <p>&lt; 80%</p>
    </div>
  </div>

  <div className="stat-card yellow">
    <div className="stat-icon">⚠️</div>
    <div>
      <strong>{nearFullGroups}</strong>
      <h3>Near Full</h3>
      <p>≥ 80%</p>
    </div>
  </div>

  <div className="stat-card red">
    <div className="stat-icon">✓</div>
    <div>
      <strong>{completedGroups}</strong>
      <h3>Completed</h3>
    </div>
  </div>

</div>


      {loading && <p>Loading groups...</p>}

      {error && <p>{error}</p>}
      {/* ALL GROUPS SECTION */}
      <div className={`groups-content-layout ${selectedGroup ? "with-details" : ""}`}>
<section className="panel groups-table-panel">

  <div className="panel-header">
    <h2>All Groups</h2>

    <button
  type="button"
  className="add-group-btn"
  onClick={() => {
    setGroupName("");
    setGroupCapacity("");
    setAddGroupError("");
    setShowAddGroup(true);
  }}
>
  + Add Group
</button>
  </div>

  <div className="groups-toolbar">
  <input
    type="text"
    placeholder="Search groups..."
    value={search}
    onChange={(e) => {
  setSearch(e.target.value);
  setCurrentPage(1);
}}
  />

  <select
    value={statusFilter}
    onChange={(e) => {
  setStatusFilter(e.target.value);
  setCurrentPage(1);
}}
  >
    <option value="All Status">All Status</option>
    <option value="Low">Low</option>
    <option value="In Progress">In Progress</option>
    <option value="Almost Complete">Near Full</option>
    <option value="Completed">Completed</option>
  </select>
</div>

<div className="groups-table-wrapper">
  <table className="groups-table">
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
      {filteredGroups.length > 0 ? (
        currentGroups.map((group) => {
          const percentage = Number(group.percentage) || 0;

          const statusClass =
            group.status === "Completed"
              ? "completed"
              : group.status === "Almost Complete"
              ? "near-full"
              : group.status === "In Progress"
              ? "in-progress"
              : "low";

          return (
            <tr key={group.id}>
              <td className="group-name-cell">
                {group.name}
              </td>

              <td>{group.current_count}</td>

              <td>{group.capacity}</td>

              <td>
                <div className="group-progress">
                  <span>{percentage}%</span>

                  <div className="progress-track">
                    <div
                      className={`progress-fill ${statusClass}`}
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </td>

              <td>
                <span className={`group-status ${statusClass}`}>
                  {group.status === "Almost Complete"
                    ? "Near Full"
                    : group.status}
                </span>
              </td>
              
              <td>
  <div className="group-actions">
    <button
      type="button"
      className="action-icon view-action"
      title="View"
      onClick={() => setSelectedGroup(group)}
    >
      <Eye size={17} />
    </button>

    <button
      type="button"
      className="action-icon edit-action"
      title="Edit"
      onClick={() => handleEditGroup(group)}
    >
      <Pencil size={17} />
    </button>

   <button
  type="button"
  className="action-icon delete-action"
  title="Delete"
  onClick={() => handleOpenDeleteModal(group)}
>
  <Trash2 size={17} />
</button>
  </div>
</td>
             
            </tr>
          );
        })
      ) : (
        <tr>
          <td colSpan="5" className="no-groups">
            No groups found.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
{filteredGroups.length > 0 && (
  <div className="groups-pagination">
    <span>
      Showing {startIndex + 1} to{" "}
      {Math.min(startIndex + groupsPerPage, filteredGroups.length)}
      {" "}of {filteredGroups.length} groups
    </span>

    <div className="pagination-buttons">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, index) => (
        <button
          type="button"
          key={index + 1}
          className={currentPage === index + 1 ? "active" : ""}
          onClick={() => setCurrentPage(index + 1)}
        >
          {index + 1}
        </button>
      ))}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(currentPage + 1)}
      >
        Next
      </button>
    </div>
  </div>
)}
</section>
{selectedGroup && (
  <section className="group-details-panel">

  <div className="details-header">
    <div>
      <span className="details-label">ⓘ Group Details</span>

      <div className="details-title">
        <div className="details-icon">🎮</div>

        <div>
          <h3>{selectedGroup.name}</h3>
          <span className="details-status">
            {selectedGroup.status === "Almost Complete"
              ? "Near Full"
              : selectedGroup.status}
          </span>
        </div>
      </div>
    </div>

    <button
      className="close-details-btn"
      onClick={() => setSelectedGroup(null)}
    >
      ×
    </button>
  </div>

  <div className="details-tabs">
    <button className="active">Overview</button>
    <button>Participants</button>
    <button>Activity</button>
  </div>

  <div className="details-overview">

    <div
  className="progress-circle"
  style={{
    background: `conic-gradient(
      #f27d2a ${Math.min(Number(selectedGroup.percentage || 0), 100)}%,
      #fde6d5 0
    )`
  }}
>
      <strong>
        {Number(selectedGroup.percentage || 0)}%
      </strong>
    </div>

    <div className="details-information">

      <div className="details-info-row">
        <span>♧ Participants</span>
        <strong>
          {selectedGroup.current_count} / {selectedGroup.capacity}
        </strong>
      </div>

      <div className="details-info-row">
        <span>▤ Capacity</span>
        <strong>{selectedGroup.capacity}</strong>
      </div>

      <div className="details-info-row">
        <span>⚠ Status</span>
        <strong>
          {selectedGroup.status === "Almost Complete"
            ? "Near Full"
            : selectedGroup.status}
        </strong>
      </div>

      <div className="details-info-row">
        <span>▦ Created At</span>
        <strong>
          {selectedGroup.created_at
            ? new Date(selectedGroup.created_at).toLocaleDateString()
            : "—"}
        </strong>
      </div>

    </div>
  </div>

{/* PROGRESS OVER TIME */}
<div className="progress-history-panel">
  <div className="progress-history-header">
    <h3>Progress Over Time</h3>

    <select
      value={dateRange}
      onChange={(e) => setDateRange(e.target.value)}
    >
      <option value="7">Last 7 Days</option>
      <option value="30">Last 30 Days</option>
      <option value="90">Last 90 Days</option>
    </select>
  </div>
</div>

<div className="progress-chart">

  {selectedGroupHistory.length > 0 ? (
     <svg
      viewBox="0 0 600 230"
       width="100%"
       height="190"
        style={{ display: "block", overflow: "visible" }}
       >
      {/* Horizontal grid lines */}
      {[0, 20, 40, 60, 80, 100].map((value) => (
      <g key={value}>
      <line
      x1="40"
      y1={180 - value * 1.5}
      x2="560"
      y2={180 - value * 1.5}
      stroke="#e9e9e9"
      strokeWidth="1"
      />

      <text
      x="5"
      y={185 - value * 1.5}
      fill="#7b8495"
      fontSize="13"
       >
      {value}%
      </text>
      </g>
      ))}

      {/* Progress line */}
      <polyline
        points={chartPoints}
        fill="none"
        stroke="#f27d2a"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points */}
      {selectedGroupHistory.map((item, index) => {
        const x =
          selectedGroupHistory.length > 1
            ? 40 + (index * 520) / (selectedGroupHistory.length - 1)
            : 300;

        const percentage = Math.min(
          Math.max(Number(item.percentage) || 0, 0),
          100
        );

        const y = 180 - percentage * 1.5;

        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="4"
            fill="#ffffff"
            stroke="#f27d2a"
            strokeWidth="2"
          />
        );
      })}
      {/* Dates */}
{selectedGroupHistory.map((item, index) => {
  const x =
    selectedGroupHistory.length > 1
      ? 40 + (index * 520) / (selectedGroupHistory.length - 1)
      : 300;

  return (
    <text
      key={`date-${index}`}
      x={x}
      y="205"
      textAnchor="middle"
      fill="#7b8495"
      fontSize="11"
    >
      {new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}
    </text>
  );
})}
    </svg>
  ) : (
    <p>No progress history available yet.</p>
  )}

</div>


  <div className="details-actions">
    <button className="edit-group-btn">
      ✎ Edit Group
    </button>

    <button className="view-participants-btn">
      ♧ View Participants
    </button>
  </div>

</section>
)}
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
            <UsersRound size={30} />
            <Plus size={15} className="group-icon-plus" />
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

          <div className="group-default-row">
            <div className="default-label">
              <Users size={21} />
              <span>Initial Participants</span>
            </div>

            <div className="default-value">0</div>
          </div>

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
            <Plus size={18} />
            {addingGroup ? "Adding..." : "Add Group"}
          </button>
        </div>
      </form>
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
              onChange={(e) => setEditGroupName(e.target.value)}
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
              step="1"
              value={editGroupCapacity}
              onChange={(e) => setEditGroupCapacity(e.target.value)}
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
                    capacity > 0 ? (count / capacity) * 100 : 0;

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
                  capacity > 0 ? (count / capacity) * 100 : 0;

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
            {savingEditGroup ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* DELETE CONFIRMATION MODAL */}
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
        type="button"
        className="delete-modal-close"
        onClick={() => setShowDeleteModal(false)}
        disabled={deletingGroup}
      >
        ×
      </button>

      <div className="delete-modal-icon">
        <Trash2 size={28} />
      </div>

      <h2>Delete Group?</h2>

      <p className="delete-modal-message">
        This group has no participants. Are you sure you want to delete it?
      </p>

      <div className="delete-group-info">
        <div className="delete-group-icon">
          <Users size={22} />
        </div>

        <div className="delete-group-details">
          <strong>{selectedDeleteGroup.name}</strong>
          <span className="delete-group-meta">
            {selectedDeleteGroup.current_count ?? 0} Participants
            {" · "}
            Capacity: {selectedDeleteGroup.capacity}
          </span>
        </div>
      </div>

      <div className="delete-modal-actions">
        <button
          type="button"
          className="delete-cancel-btn"
          onClick={() => setShowDeleteModal(false)}
          disabled={deletingGroup}
        >
          Cancel
        </button>

        <button
          type="button"
          className="delete-confirm-btn"
          onClick={() => handleDeleteGroup(selectedDeleteGroup.id)}
          disabled={deletingGroup}
        >
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
  


export default Groups;


