
import { useEffect, useState } from "react";
import "../App.css";

const API = "http://127.0.0.1:8000/api";

function Participants() {
  const [participants, setParticipants] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  // Filters
const [selectedGroup, setSelectedGroup] = useState("All Groups");
const [joinedFrom, setJoinedFrom] = useState("");
const [joinedTo, setJoinedTo] = useState("");
const [appliedFilters, setAppliedFilters] = useState({

  group: "All Groups",
  from: "",
  to: "",
});
const [showAddModal, setShowAddModal] = useState(false);
const [newParticipant, setNewParticipant] = useState({
  name: "",
  email: "",
  phone: "",
  group_id: "",
});

const [savingParticipant, setSavingParticipant] = useState(false);
const [formError, setFormError] = useState("");
const [successMessage, setSuccessMessage] = useState("");

  

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [participantsResponse, groupsResponse] =
          await Promise.all([
            fetch(`${API}/participants`),
            fetch(`${API}/groups`),
          ]);

        if (!participantsResponse.ok || !groupsResponse.ok) {
          throw new Error("Unable to load participants data.");
        }

        const participantsData = await participantsResponse.json();
        const groupsData = await groupsResponse.json();

        setParticipants(participantsData);
        setGroups(groupsData);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
    const handleAddParticipant = async (e) => {
  e.preventDefault();

  setSavingParticipant(true);
  setFormError("");

  try {
    const startTime = performance.now();
    const response = await fetch(
      `${API}/groups/${newParticipant.group_id}/participants`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: newParticipant.name,
          email: newParticipant.email,
          phone: newParticipant.phone,
        }),
      }
    );

    const data = await response.json();
    console.log(
  "Participant POST duration:",
  ((performance.now() - startTime) / 1000).toFixed(2),
  "seconds"
);

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to add participant."
      );
    }
     
    const selectedGroup = groups.find(
  (group) => String(group.id) === String(newParticipant.group_id)
);

setParticipants((prev) => [
  {
    ...data.participant,
    group: selectedGroup,
  },
  ...prev,
]);

    const groupsResponse = await fetch(`${API}/groups`);
    if (groupsResponse.ok) {
      const groupsData = await groupsResponse.json();
      setGroups(groupsData);
    }

    setNewParticipant({
      name: "",
      email: "",
      phone: "",
      group_id: "",
    });

    setShowAddModal(false);
    setSuccessMessage("Participant added successfully!");
    setActiveTab("all");
setAppliedFilters({
  group: "All Groups",
  from: "",
  to: "",
});
setSelectedGroup("All Groups");
setJoinedFrom("");
setJoinedTo("");
  } catch (err) {
    setFormError(
  err.message === "Ce groupe a atteint sa capacité maximale."
    ? "This group has reached its maximum capacity."
    : err.message || "Something went wrong."
);
  } finally {
    setSavingParticipant(false);
  }
};
  const nearFullGroups = groups.filter(
  (group) => group.status === "Presque complet"
).length;

const completedGroups = groups.filter(
  (group) => group.status === "Terminé"
).length;
const filteredParticipants = participants.filter((participant) => {
  const matchesGroup =
    appliedFilters.group === "All Groups" ||
    String(participant.group_id) === appliedFilters.group;

  const joinedDate = participant.created_at
    ? String(participant.created_at).slice(0, 10)
    : "";

  const matchesFrom =
    !appliedFilters.from || joinedDate >= appliedFilters.from;

  const matchesTo =
    !appliedFilters.to || joinedDate <= appliedFilters.to;

  return matchesGroup && matchesFrom && matchesTo;
});
const participantsByGroup = groups.map((group) => ({
  ...group,
  participants: filteredParticipants.filter(
    (participant) =>
      String(participant.group_id) === String(group.id)
  ),
})).filter((group) => group.participants.length > 0);

  return (
    <div className="content participants-page">
      <div className="page-title">
        <h1>Participants</h1>
        <p>Manage group participants and view their information.</p>
      </div>
      {successMessage && (
  <div className="participant-success-message">
    <span>✓</span>
    {successMessage}
    <button
      type="button"
      onClick={() => setSuccessMessage("")}
    >
      ×
    </button>
  </div>
)}

      {loading ? (
        <p>Loading participants...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <>
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

          <section className="panel participants-panel">
            <div className="panel-header">
  <h2>All Participants</h2>

  <button
    type="button"
    className="add-group-btn"
    onClick={() => {
      setFormError("");
      setShowAddModal(true);
    }}
  >
    + Add Participant
  </button>
</div>
            <div className="participants-tabs">
            <button
            className={activeTab === "all" ? "active" : ""}
            onClick={() => setActiveTab("all")}
            >
            All Participants
            </button>

            <button
             className={activeTab === "group" ? "active" : ""}
             onClick={() => setActiveTab("group")}
             >
             By Group
             </button>
             </div>
             
{activeTab === "all" ? (
  <div className="participants-content-layout">

  {/* FILTERS PANEL */}
  <aside className="participants-filters">

    <div className="filters-heading">
      <h3>Filters</h3>
      <button
        type="button"
        onClick={() => {
          setSelectedGroup("All Groups");
          setJoinedFrom("");
          setJoinedTo("");
          setAppliedFilters({
            group: "All Groups",
            from: "",
            to: "",
          });
        }}
      >
        Reset
      </button>
    </div>

    <div className="filter-field">
      <label>Group</label>
      <select
        value={selectedGroup}
        onChange={(e) => setSelectedGroup(e.target.value)}
      >
        <option value="All Groups">All Groups</option>
        {groups.map((group) => (
          <option key={group.id} value={String(group.id)}>
            {group.name}
          </option>
        ))}
      </select>
    </div>

    <div className="filter-field">
      <label>Joined From</label>
      <input
        type="date"
        value={joinedFrom}
        onChange={(e) => setJoinedFrom(e.target.value)}
      />
    </div>

    <div className="filter-field">
      <label>Joined To</label>
      <input
        type="date"
        value={joinedTo}
        onChange={(e) => setJoinedTo(e.target.value)}
      />
    </div>

    <button
      className="apply-filters-btn"
      onClick={() =>
        setAppliedFilters({
          group: selectedGroup,
          from: joinedFrom,
          to: joinedTo,
        })
      }
    >
      Apply Filters
    </button>

  </aside>

  {/* PARTICIPANTS TABLE */}
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
                  {filteredParticipants.map((participant) => (
                    <tr key={participant.id}>
                      <td>{participant.name}</td>
                      <td>
                        <div>{participant.email || "—"}</div>
                        <div>{participant.phone || "—"}</div>
                      </td>
                      <td>
                        {participant.group?.name || "—"}
                      </td>
                      <td>
                        {participant.created_at
                          ? new Date(
                              participant.created_at
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

{filteredParticipants.length === 0 && (
  <p className="empty-message">
    No participants found.
  </p>
)}
            </div>
          </div>
        
    ) : (
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
    )}
          
          </section>
          {showAddModal && (
  <div className="participant-modal-overlay">
    <div className="participant-modal">

      <div className="participant-modal-header">
        <div>
          <h2>Add New Participant</h2>
          <p>Enter the participant information below.</p>
        </div>

        <button
          type="button"
          className="modal-close-btn"
          onClick={() => setShowAddModal(false)}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleAddParticipant}>

        <div className="modal-form-field">
          <label>Full Name *</label>
          <input
            type="text"
            value={newParticipant.name}
            onChange={(e) =>
              setNewParticipant({
                ...newParticipant,
                name: e.target.value,
              })
            }
            placeholder="Enter participant name"
            required
          />
        </div>

        <div className="modal-form-field">
          <label>Email Address</label>
          <input
            type="email"
            value={newParticipant.email}
            onChange={(e) =>
              setNewParticipant({
                ...newParticipant,
                email: e.target.value,
              })
            }
            placeholder="example@email.com"
          />
        </div>

        <div className="modal-form-field">
          <label>Phone Number</label>
          <input
            type="tel"
            value={newParticipant.phone}
            onChange={(e) =>
              setNewParticipant({
                ...newParticipant,
                phone: e.target.value,
              })
            }
            placeholder="Enter phone number"
          />
        </div>

        <div className="modal-form-field">
          <label>Group *</label>
          <select
            value={newParticipant.group_id}
            onChange={(e) =>
              setNewParticipant({
                ...newParticipant,
                group_id: e.target.value,
              })
            }
            required
          >
            <option value="">Select a group</option>

            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {formError && (
          <p className="modal-error">{formError}</p>
        )}

        <div className="participant-modal-actions">
          <button
            type="button"
            className="modal-cancel-btn"
            onClick={() => setShowAddModal(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="modal-submit-btn"
            disabled={savingParticipant}
          >
            {savingParticipant ? "Adding..." : "Add Participant"}
          </button>
        </div>

      </form>
    </div>
  </div>
)}
        </>
      )}
    </div>
  );
}

export default Participants;
