import { useEffect, useState } from "react";
import { Eye, UsersRound, Layers, CalendarDays, AlertTriangle } from "lucide-react";
import "../App.css";

const API = "http://127.0.0.1:8000/api";
const GROUPS_PER_PAGE = 5;

const getVisiblePages = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

function Groups() {
  const [groupsPagination, setGroupsPagination] = useState({
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [stats, setStats] = useState({
  total_groups: 0,
  low: 0,
  in_progress: 0,
  almost_complete: 0,
  completed: 0,
});
  const [progressHistory, setProgressHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [dateRange, setDateRange] = useState("7");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch accurate global KPI stats once
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/dashboard?groups_only=1`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setStats({
             total_groups: data.total_groups || 0,
              low: data.low_groups_count || 0,
             in_progress: data.in_progress_groups_count || 0,
              almost_complete: data.almost_complete_groups_count || 0,
             completed: data.completed_groups_count || 0,
             });
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Fetch paginated & filtered groups from server
  useEffect(() => {
    const controller = new AbortController();
    setTableLoading(true);

    const params = new URLSearchParams({
      page: String(currentPage),
      per_page: String(GROUPS_PER_PAGE),
      search: debouncedSearch,
      status: statusFilter,
    });

    fetch(`${API}/groups?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load groups.");
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.data)) {
          setGroupsPagination(data);
        } else {
          const list = Array.isArray(data) ? data : [];
          setGroupsPagination({
            data: list,
            current_page: 1,
            last_page: 1,
            total: list.length,
            from: list.length > 0 ? 1 : 0,
            to: list.length,
          });
        }
        setError("");
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError("Unable to load groups. Please try again.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setTableLoading(false);
        }
      });

    return () => controller.abort();
  }, [currentPage, debouncedSearch, statusFilter]);

  // Lazy-load progress history ONLY when a group is selected
  useEffect(() => {
    if (!selectedGroup) return;
    const controller = new AbortController();
    setHistoryLoading(true);

    fetch(`${API}/dashboard/progress-history?group_id=${selectedGroup.id}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProgressHistory(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setHistoryLoading(false);
      });

    return () => controller.abort();
  }, [selectedGroup]);

  const currentGroups = groupsPagination.data || [];
  const totalPages = groupsPagination.last_page || 1;

  const selectedGroupHistory = selectedGroup
    ? progressHistory
        .filter((item) => {
          const recordDate = new Date(item.created_at);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - Number(dateRange));
          return recordDate >= cutoffDate;
        })
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : [];

  const chartPoints = selectedGroupHistory
    .map((item, index) => {
      const x =
        selectedGroupHistory.length > 1
          ? 40 + (index * 520) / (selectedGroupHistory.length - 1)
          : 300;
      const percentage = Math.min(Math.max(Number(item.percentage) || 0, 0), 100);
      const y = 220 - percentage * 1.8;
      return `${x},${y}`;
    })
    .join(" ");

  const getStatusClass = (status) => {
    if (status === "Completed") return "completed";
    if (status === "Almost Complete") return "near-full";
    if (status === "In Progress") return "in-progress";
    return "low";
  };

  const getStatusLabel = (status) => status;

  return (
    <main className="content">
      <div className="page-title">
        <div>
          <h1>Groups Management</h1>
          <p className="description">View and monitor your groups.</p>
        </div>
      </div>

      <div className="groups-stats-grid">
        <div className="stat-card orange">
          <div className="stat-icon">👥</div>
          <div>
            <strong>{stats.total_groups}</strong>
            <h3>Total Groups</h3>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">⌛</div>
          <div>
            <strong>{stats.in_progress}</strong>
            <h3>In Progress</h3>
            <p>&lt; 80%</p>
          </div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-icon">⚠️</div>
          <div>
            <strong>{stats.near_full}</strong>
            <h3>Almost Complete</h3>
            <p>≥ 80%</p>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon">✓</div>
          <div>
            <strong>{stats.completed}</strong>
            <h3>Completed</h3>
          </div>
        </div>
      </div>

      {loading && <p>Loading groups...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <div className={`groups-content-layout ${selectedGroup ? "with-details" : ""}`}>
          <section className="panel groups-table-panel">
            <div className="panel-header">
              <h2>All Groups</h2>
            </div>

            <div className="groups-toolbar">
              <input
                type="text"
                placeholder="Search groups..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
                <option value="Almost Complete">Almost Complete</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="groups-table-wrapper" style={{ opacity: tableLoading ? 0.6 : 1 }}>
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
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
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

            {groupsPagination.total > 0 && (
              <div className="groups-pagination">
                <span>
                  Showing {groupsPagination.from || 0} to {groupsPagination.to || 0} of{" "}
                  {groupsPagination.total} groups
                </span>

                <div className="pagination-buttons">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => page - 1)}
                  >
                    ‹
                  </button>

                  {getVisiblePages(currentPage, totalPages).map((page, idx) =>
                    page === "..." ? (
                      <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>
                    ) : (
                      <button
                        type="button"
                        key={page}
                        className={currentPage === page ? "active" : ""}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  )}

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

              <div className="details-overview">
                <div className="progress-circle">
                  <svg viewBox="0 0 120 120">
                    <circle className="progress-track" cx="60" cy="60" r="50" />
                    <circle
                      className="progress-value"
                      cx="60"
                      cy="60"
                      r="50"
                      style={{
                        strokeDasharray: `${Math.min(Number(selectedGroup.percentage) || 0, 100) * 3.14} 314`,
                      }}
                    />
                  </svg>
                  <strong>{Number(selectedGroup.percentage) || 0}%</strong>
                </div>

                <div className="details-information">
                  <div className="details-info-row">
                    <span><UsersRound /> Participants</span>
                    <strong>{selectedGroup.current_count} / {selectedGroup.capacity}</strong>
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

                <div className="progress-chart">
                  {historyLoading ? (
                    <p>Loading chart...</p>
                  ) : selectedGroupHistory.length > 0 ? (
                    <svg viewBox="0 0 600 280" width="100%" height="240" style={{ display: "block", overflow: "visible" }}>
                      {[0, 20, 40, 60, 80, 100].map((value) => (
                        <g key={value}>
                          <line x1="40" y1={220 - value * 1.8} x2="560" y2={220 - value * 1.8} stroke="#e9e9e9" strokeWidth="1" />
                          <text x="5" y={225 - value * 1.8} fill="#40434a" fontSize="14">{value}%</text>
                        </g>
                      ))}
                      <polyline points={chartPoints} fill="none" stroke="#f27d2a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      {selectedGroupHistory.map((item, index) => {
                        const x = selectedGroupHistory.length > 1 ? 40 + (index * 520) / (selectedGroupHistory.length - 1) : 300;
                        const percentage = Math.min(Math.max(Number(item.percentage) || 0, 0), 100);
                        const y = 220 - percentage * 1.8;
                        return <circle key={`point-${index}`} cx={x} cy={y} r="4" fill="#ffffff" stroke="#f27d2a" strokeWidth="2" />;
                      })}
                      {selectedGroupHistory.map((item, index) => {
                        const x = selectedGroupHistory.length > 1 ? 40 + (index * 520) / (selectedGroupHistory.length - 1) : 300;
                        return (
                          <text key={`date-${index}`} x={x} y="250" textAnchor="middle" fill="#59606d" fontSize="13">
                            {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </text>
                        );
                      })}
                    </svg>
                  ) : (
                    <p>No progress history available yet.</p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

export default Groups;