import { useEffect, useState } from "react";
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

  const filteredGroups = groups.filter((group) => {
  const matchesSearch = (group.name || "")
    .toLowerCase()
    .includes(search.toLowerCase());

   const matchesStatus =
    statusFilter === "All Status" ||
    group.status === statusFilter;

  return matchesSearch && matchesStatus;
  });

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

  <div className="groups-stat-card">
    <div className="groups-stat-icon orange">👥</div>
    <div>
      <h2>{totalGroups}</h2>
      <p>Total Groups</p>
    </div>
  </div>

  <div className="groups-stat-card">
    <div className="groups-stat-icon purple">⌛</div>
    <div>
      <h2>{inProgressGroups}</h2>
      <p>In Progress</p>
      <small>&lt; 80%</small>
    </div>
  </div>

 <div className="groups-stat-card">
    <div className="groups-stat-icon warning">⚠</div>
    <div>
      <h2>{nearFullGroups}</h2>
      <p>Near Full</p>
      <small>≥ 80%</small>
    </div>
  </div>


  <div className="groups-stat-card">
    <div className="groups-stat-icon green">✓</div>
    <div>
      <h2>{completedGroups}</h2>
      <p>Completed</p>
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

    <button className="add-group-btn">
      + Add Group
    </button>
  </div>

  <div className="groups-toolbar">
  <input
    type="text"
    placeholder="Search groups..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
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
        filteredGroups.map((group) => {
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
              <button
              className="view-group-btn"
              onClick={() => setSelectedGroup(group)}
              >
               View
              </button>
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
  </main>
  );
}
  


export default Groups;


