import { useEffect, useState } from "react";
import { UsersRound } from "lucide-react";
import "../App.css";

const API = "http://127.0.0.1:8000/api";

function Participants() {
  // Page data
  const [participants, setParticipants] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // Load participants and groups from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [participantsResponse, groupsResponse] = await Promise.all([
          fetch(`${API}/participants`),
          fetch(`${API}/groups`),
        ]);

        if (!participantsResponse.ok || !groupsResponse.ok) {
          throw new Error("Unable to load participants data.");
        }

        const participantsData = await participantsResponse.json();
        const groupsData = await groupsResponse.json();

        setParticipants(
          Array.isArray(participantsData) ? participantsData : []
        );
        setGroups(Array.isArray(groupsData) ? groupsData : []);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

// Calculate group statistics using backend progression rules
const getFillPercentage = (group) => {
  const capacity = Number(group.capacity) || 0;
  const currentCount = Number(group.current_count) || 0;

  if (capacity <= 0) return 0;

  return (currentCount / capacity) * 100;
};

const nearFullGroups = groups.filter((group) => {
  const percentage = getFillPercentage(group);
  return percentage >= 80 && percentage < 100;
}).length;

const completedGroups = groups.filter(
  (group) => getFillPercentage(group) >= 100
).length;

// Get the selected group
const selectedGroup = groups.find(
  (group) => String(group.id) === selectedGroupId
);

// Get participants of the selected group
const groupParticipants = selectedGroup
  ? participants.filter(
      (participant) =>
        String(participant.group_id) === String(selectedGroup.id)
    )
  : [];

  return (
    <div className="content participants-page">
      {/* Page heading */}
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
              <div className="stat-icon orange">👥</div>
              <div>
                <h2>{participants.length}</h2>
                <p>Total Participants</p>
              </div>
            </div>

            <div className="participant-stat-card">
              <div className="stat-icon purple">👥</div>
              <div>
                <h2>{groups.length}</h2>
                <p>Total Groups</p>
              </div>
            </div>

            <div className="stat-card yellow">
            <div className="stat-icon">⚠️</div>
             <div>
               <strong>{nearFullGroups}</strong>
               <h3>Near Full</h3>
               <p>Groups at 80% or more</p>
             </div>
             </div>

            <div className="stat-card red">
             <div className="stat-icon">✓</div>
             <div>
              <strong>{completedGroups}</strong>
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
      onChange={(e) => setSelectedGroupId(e.target.value)}
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
          <p>
            {groupParticipants.length} Participants
          </p>
        </div>
      </div>

      {groupParticipants.length > 0 ? (
        <div className="group-participants-list">
          {groupParticipants.map((participant) => (
            <div
              className="group-participant-row"
              key={participant.id}
            >
              <span>{participant.name}</span>
              <span>{participant.email || "—"}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-message">
          No participants in this group.
        </p>
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

