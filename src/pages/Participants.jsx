import { useEffect, useState } from "react";
import "../App.css";

const API = "http://127.0.0.1:8000/api";

function Participants() {
  // Page data
  const [participants, setParticipants] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // Calculate the number of groups in each status
  const nearFullGroups = groups.filter(
    (group) => group.status === "Presque complet"
  ).length;

  const completedGroups = groups.filter(
    (group) => group.status === "Terminé"
  ).length;

  // Organize participants under their corresponding group
  const participantsByGroup = groups
    .map((group) => ({
      ...group,
      participants: participants.filter(
        (participant) =>
          String(participant.group_id) === String(group.id)
      ),
    }))
    .filter((group) => group.participants.length > 0);

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

            <div className="participant-stat-card">
              <div className="stat-icon peach">⚠</div>
              <div>
                <h2>{nearFullGroups}</h2>
                <p>Near Full Groups</p>
              </div>
            </div>

            <div className="participant-stat-card">
              <div className="stat-icon green">✓</div>
              <div>
                <h2>{completedGroups}</h2>
                <p>Completed Groups</p>
              </div>
            </div>
          </div>

          {/* Participants grouped by group */}
          <section className="panel participants-panel">
            <div className="panel-header">
              <h2>Participants by Group</h2>
            </div>

            <div className="participants-by-group">
              {participantsByGroup.length > 0 ? (
                participantsByGroup.map((group) => (
                  <div className="group-participants-card" key={group.id}>
                    <h3>{group.name}</h3>
                    <p>{group.participants.length} Participants</p>

                    <div className="group-participants-list">
                      {group.participants.map((participant) => (
                        <div
                          className="group-participant-row"
                          key={participant.id}
                        >
                          <span>{participant.name}</span>
                          <span>{participant.email || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message">No participants found.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Participants;

