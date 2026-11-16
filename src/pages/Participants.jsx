import { useEffect, useState } from "react";
import { UsersRound, Mail, Phone } from "lucide-react";
import "../App.css";

const API = "http://127.0.0.1:8000/api";
const PARTICIPANTS_PER_PAGE = 10;

const getVisiblePages = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

const formatPhoneNumber = (phone) => {
  if (!phone) return "—";
  let number = String(phone).replace(/\D/g, "");
  if (number.startsWith("0")) {
    number = "212" + number.substring(1);
  } else if (!number.startsWith("212")) {
    number = "212" + number;
  }
  if (number.length === 12) {
    return `+212 ${number[3]} ${number.slice(4, 6)} ${number.slice(6, 8)} ${number.slice(8, 10)} ${number.slice(10, 12)}`;
  }
  return `+${number}`;
};

function Participants() {
  // Global stats & group selector options
  const [stats, setStats] = useState({
    total_participants: 0,
    total_groups: 0,
    near_full: 0,
    completed: 0,
  });
  const [groups, setGroups] = useState([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [debouncedGroupSearch, setDebouncedGroupSearch] = useState("");
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsPage, setGroupsPage] = useState(1);
  const [groupsLastPage, setGroupsLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Selected group & paginated participants
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [participantsPagination, setParticipantsPagination] = useState({
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Load only lightweight stats and groups list on mount (no participants fetched yet)
  useEffect(() => {
    const controller = new AbortController();

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError("");

       const dashboardRes = await fetch(
         `${API}/dashboard?groups_only=1`,
          { signal: controller.signal }
        );
       if (!dashboardRes.ok) {
         throw new Error("Unable to load participants data.");
       }

        const dashboardData = await dashboardRes.json();
        

        setStats({
          total_participants: dashboardData.total_participants || 0,
          total_groups: dashboardData.total_groups || 0,
          near_full: dashboardData.nearly_complete_groups_count || 0,
          completed: dashboardData.full_groups_count || 0,
        });

      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchInitialData();
    return () => controller.abort();
  }, []);
  // Debounce group search
useEffect(() => {
  const timeoutId = setTimeout(() => {
    setDebouncedGroupSearch(groupSearch);
    setGroupsPage(1);
  }, 400);

  return () => clearTimeout(timeoutId);
}, [groupSearch]);

  // 2. Fetch paginated participants ONLY when a group is selected or page changes
  useEffect(() => {
    if (!selectedGroupId) return;

    const controller = new AbortController();
    setParticipantsLoading(true);

    const params = new URLSearchParams({
      page: String(currentPage),
      per_page: String(PARTICIPANTS_PER_PAGE),
    });

    fetch(`${API}/groups/${selectedGroupId}/participants?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load group participants.");
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.data)) {
          setParticipantsPagination(data);
        } else {
          const list = Array.isArray(data) ? data : [];
          setParticipantsPagination({
            data: list,
            current_page: 1,
            last_page: 1,
            total: list.length,
            from: list.length > 0 ? 1 : 0,
            to: list.length,
          });
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Group participants error:", err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setParticipantsLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedGroupId, currentPage]);

  const selectedGroup = groups.find((group) => String(group.id) === selectedGroupId);
  const groupParticipants = participantsPagination.data || [];
  const totalPages = participantsPagination.last_page || 1;

  const handleGroupChange = (e) => {
    setSelectedGroupId(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="content participants-page">
      <div className="page-title">
        <h1>Participants</h1>
        <p>View participants organized by group.</p>
      </div>

      {loading ? (
        <p>Loading participants...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <>
          {/* Participants overview cards */}
          <div className="participants-stats">
            <div className="participant-stat-card">
              <div className="stat-icon orange">👤</div>
              <div>
                <h2>{stats.total_participants}</h2>
                <p>Total Participants</p>
              </div>
            </div>

            <div className="participant-stat-card">
              <div className="stat-icon purple">👥</div>
              <div>
                <h2>{stats.total_groups}</h2>
                <p>Total Groups</p>
              </div>
            </div>

            <div className="stat-card yellow">
              <div className="stat-icon">⚠️</div>
              <div>
                <strong>{stats.near_full}</strong>
                <h3>Near Full</h3>
                <p>Groups at 80% or more</p>
              </div>
            </div>

            <div className="stat-card red">
              <div className="stat-icon">✓</div>
              <div>
                <strong>{stats.completed}</strong>
                <h3>Full Group</h3>
                <p>Groups at 100% capacity</p>
              </div>
            </div>
          </div>

          {/* Participants by Group */}
          <section className="panel participants-panel">
            <div className="panel-header">
              <h2>Participants by Group</h2>
            </div>

            <div className="participants-group-selector">
              <label htmlFor="select-group">Select a Group</label>

              <select
                id="select-group"
                value={selectedGroupId}
                onChange={handleGroupChange}
              >
                <option value="">Choose a group...</option>
                {groups.map((group) => (
                  <option key={group.id} value={String(group.id)}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {!selectedGroup ? (
              <div className="participants-empty-state">
                <div className="participants-empty-icon">
                  <UsersRound size={40} strokeWidth={2} />
                </div>
                <h3>No group selected</h3>
                <p>Please select a group to view its participants.</p>
              </div>
            ) : (
              <div className="selected-group-content">
                <div className="selected-group-header">
                  <div>
                    <h3>{selectedGroup.name}</h3>
                    <p>{participantsPagination.total} Participants</p>
                  </div>
                </div>

                {participantsLoading ? (
                  <p>Loading group participants...</p>
                ) : groupParticipants.length > 0 ? (
                  <>
                    <div className="participants-table-wrapper">
                      <table className="participants-table">
                        <thead>
                          <tr>
                            <th>Participant</th>
                            <th>Contact</th>
                            <th>Group</th>
                            <th>Joined At</th>
                          </tr>
                        </thead>

                        <tbody>
                          {groupParticipants.map((participant) => (
                            <tr key={participant.id}>
                              <td className="participant-name">{participant.name}</td>

                              <td>
                                <div className="participant-contact">
                                  <div className="contact-line">
                                    <Mail size={14} />
                                    <span>{participant.email || "—"}</span>
                                  </div>

                                  <div className="contact-line">
                                    <Phone size={14} />
                                    <span>{formatPhoneNumber(participant.phone)}</span>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <span className="participant-group-name">
                                  {selectedGroup.name}
                                </span>
                              </td>

                              <td>
                                {participant.created_at
                                  ? new Date(participant.created_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Server-side Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="groups-pagination" style={{ marginTop: "16px" }}>
                        <span>
                          Showing {participantsPagination.from || 0} to{" "}
                          {participantsPagination.to || 0} of{" "}
                          {participantsPagination.total} participants
                        </span>

                        <div className="pagination-controls">
                          <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                          >
                            ‹
                          </button>

                          {getVisiblePages(currentPage, totalPages).map((page, idx) =>
                            page === "..." ? (
                              <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                                ...
                              </span>
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
                            onClick={() => setCurrentPage((p) => p + 1)}
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="empty-message">No participants in this group.</p>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Participants;

