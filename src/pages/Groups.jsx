import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import {
  UsersRound,
  Layers,
  CalendarDays,
  AlertTriangle
} from "lucide-react";
import "../App.css";

const API = "http://127.0.0.1:8000/api";
const GROUPS_PER_PAGE = 5;

function Groups() {
  // Main page data
  const [groups, setGroups] = useState([]);
  const [progressHistory, setProgressHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search, status filter, and pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);

  // Selected group details and chart range
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [dateRange, setDateRange] = useState("7");

  // Load groups when the page opens
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(`${API}/groups`);

        if (!response.ok) {
          throw new Error("Failed to load groups.");
        }

        const data = await response.json();
        setGroups(Array.isArray(data) ? data : data.groups || []);
      } catch (err) {
        console.error("Groups loading error:", err);
        setError("Unable to load groups. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Load group progress history for the details chart
  useEffect(() => {
    const fetchProgressHistory = async () => {
      try {
        const response = await fetch(`${API}/dashboard/progress-history`);

        if (!response.ok) {
          throw new Error("Failed to load progress history.");
        }

        const data = await response.json();
        setProgressHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Progress history loading error:", err);
      }
    };

    fetchProgressHistory();
  }, []);

  // Calculate the statistics displayed above the table
  const totalGroups = groups.length;

  const completedGroups = groups.filter(
    (group) => Number(group.percentage) >= 100
  ).length;

  const nearFullGroups = groups.filter((group) => {
    const percentage = Number(group.percentage) || 0;
    return percentage >= 80 && percentage < 100;
  }).length;

  const inProgressGroups = groups.filter(
    (group) => (Number(group.percentage) || 0) < 80
  ).length;

  // Filter groups by name and status
  const filteredGroups = groups.filter((group) => {
    const matchesSearch = (group.name || "")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All Status" || group.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate the visible page of groups
  const totalPages = Math.ceil(filteredGroups.length / GROUPS_PER_PAGE);
  const startIndex = (currentPage - 1) * GROUPS_PER_PAGE;

  const currentGroups = filteredGroups.slice(
    startIndex,
    startIndex + GROUPS_PER_PAGE
  );

  // Get the selected group's progress records within the chosen date range
  const selectedGroupHistory = selectedGroup
    ? progressHistory
        .filter(
          (item) => String(item.group_id) === String(selectedGroup.id)
        )
        .filter((item) => {
          const recordDate = new Date(item.created_at);
          const cutoffDate = new Date();

          cutoffDate.setDate(
            cutoffDate.getDate() - Number(dateRange)
          );

          return recordDate >= cutoffDate;
        })
        .sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        )
    : [];

  // Convert progress history values into SVG chart coordinates
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

      const y = 220 - percentage * 1.8;

      return `${x},${y}`;
    })
    .join(" ");

  // Display the status using the same labels and styles as the table
  const getStatusClass = (status) => {
    if (status === "Completed") return "completed";
    if (status === "Almost Complete") return "near-full";
    if (status === "In Progress") return "in-progress";
    return "low";
  };

  const getStatusLabel = (status) =>
    status === "Almost Complete" ? "Near Full" : status;

  return (
    <main className="content">
      {/* Page heading */}
      <div className="page-title">
        <div>
          <h1>Groups Management</h1>
          <p className="description">
            View and monitor your groups.
          </p>
        </div>
      </div>

      {/* Group statistics */}
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

      {/* Loading and error messages */}
      {loading && <p>Loading groups...</p>}
      {error && <p role="alert">{error}</p>}

      {/* Groups table and optional details panel */}
      {!loading && !error && (
        <div
          className={`groups-content-layout ${
            selectedGroup ? "with-details" : ""
          }`}
        >
          {/* Groups table */}
          <section className="panel groups-table-panel">
            <div className="panel-header">
              <h2>All Groups</h2>
            </div>

            {/* Search and status filter */}
            <div className="groups-toolbar">
              <input
                type="text"
                placeholder="Search groups..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
              />

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
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

            {/* Groups data table: View is the only available action */}
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
                  {currentGroups.length > 0 ? (
                    currentGroups.map((group) => {
                      const percentage = Number(group.percentage) || 0;
                      const statusClass = getStatusClass(group.status);

                      return (
                        <tr key={group.id}>
                          <td className="group-name-cell">{group.name}</td>
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
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`group-status ${statusClass}`}>
                              {getStatusLabel(group.status)}
                            </span>
                          </td>
                          <td>
                            <div className="group-actions">
                              <button
                                type="button"
                                className="action-icon view-action"
                                title="View"
                                aria-label={`View ${group.name}`}
                                onClick={() => setSelectedGroup(group)}
                              >
                                <Eye size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-groups">
                        No groups found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredGroups.length > 0 && (
              <div className="groups-pagination">
                <span>
                  Showing {startIndex + 1} to{" "}
                  {Math.min(
                    startIndex + GROUPS_PER_PAGE,
                    filteredGroups.length
                  )}{" "}
                  of {filteredGroups.length} groups
                </span>

                <div className="pagination-buttons">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => page - 1)}
                  >
                    ‹
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      type="button"
                      key={index + 1}
                      className={
                        currentPage === index + 1 ? "active" : ""
                      }
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => page + 1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Group details: Overview only */}
          {selectedGroup && (
            <section className="group-details-panel">
              <div className="details-header">
               <div className="details-title">
                <h3>{selectedGroup.name}</h3>
                <span className="details-status">
                 {getStatusLabel(selectedGroup.status)}
                 </span>
                 </div>

                 <button
                   type="button"
                    className="close-details-btn"
                     aria-label="Close group details"
                      onClick={() => setSelectedGroup(null)}
                       >
                        ×
                      </button>
                      </div>
                     <div className="details-tabs">
                      <button className="active">
                      <span>▥</span> Overview
                       </button>

                            </div>
              {/* Overview information */}
              <div className="details-overview">
             <div className="progress-circle">
  <svg viewBox="0 0 120 120">
    <circle
      className="progress-track"
      cx="60"
      cy="60"
      r="50"
    />

    <circle
      className="progress-value"
      cx="60"
      cy="60"
      r="50"
      style={{
        strokeDasharray: `${Math.min(
          Number(selectedGroup.percentage) || 0,
          100
        ) * 3.14} 314`,
      }}
    />
  </svg>

  <strong>{Number(selectedGroup.percentage) || 0}%</strong>
</div>
                 <div className="details-information">
  <div className="details-info-row">
    <span><UsersRound /> Participants</span>
    <strong>
      {selectedGroup.current_count} / {selectedGroup.capacity}
    </strong>
  </div>

  <div className="details-info-row">
    <span><Layers /> Capacity</span>
    <strong>{selectedGroup.capacity}</strong>
  </div>

  <div className="details-info-row">
    <span><CalendarDays /> Created At</span>
    <strong>
      {selectedGroup.created_at
        ? new Date(selectedGroup.created_at).toLocaleDateString()
        : "—"}
    </strong>
  </div>

  <div className="details-info-row">
    <span><AlertTriangle /> Status</span>
    <strong>{getStatusLabel(selectedGroup.status)}</strong>
  </div>
</div>
              </div>

              {/* Progress history chart */}
               <div className="progress-history-panel">
  <div className="progress-history-header">
    <h3>Progress Over Time</h3>

    <select
      value={dateRange}
      onChange={(event) => setDateRange(event.target.value)}
    >
      <option value="7">Last 7 Days</option>
      <option value="30">Last 30 Days</option>
      <option value="90">Last 90 Days</option>
    </select>
  </div>
<div className="progress-chart"></div>
 
</div>
              <div className="progress-chart">
                {selectedGroupHistory.length > 0 ? (
                 <svg
                   viewBox="0 0 600 280"
                   width="200%"
                   height="240"
                    style={{ display: "block", overflow: "visible" }}
                  >
                    {/* Horizontal grid lines and percentage labels */}
                    {[0, 20, 40, 60, 80, 100].map((value) => (
                      <g key={value}>
                        <line
                          x1="40"
                          y1={220 - value * 1.8}
                          x2="560"
                          y2={220 - value * 1.8}
                          stroke="#e9e9e9"
                          strokeWidth="1"
                        />
                        <text
                          x="5"
                          y={225 - value * 1.8}
                          fill="#40434a"
                          fontSize="14"
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

                    {/* Data points */}
                    {selectedGroupHistory.map((item, index) => {
                      const x =
                        selectedGroupHistory.length > 1
                          ? 40 +
                            (index * 520) / (selectedGroupHistory.length - 1)
                          : 300;

                      const percentage = Math.min(
                        Math.max(Number(item.percentage) || 0, 0),
                        100
                      );

                      const y = 220 - percentage * 1.8;

                      return (
                        <circle
                          key={`point-${index}`}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#ffffff"
                          stroke="#f27d2a"
                          strokeWidth="2"
                        />
                      );
                    })}

                    {/* Dates below the chart */}
                    {selectedGroupHistory.map((item, index) => {
                      const x =
                        selectedGroupHistory.length > 1
                          ? 40 +
                            (index * 520) / (selectedGroupHistory.length - 1)
                          : 300;

                      return (
                        <text
                          key={`date-${index}`}
                          x={x}
                          y="250"
                          textAnchor="middle"
                          fill="#59606d"
                          fontSize="13"
                        >
                          {new Date(item.created_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </text>
                      );
                    })}
                  </svg>
                ) : (
                  <p>No progress history available yet.</p>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

export default Groups;