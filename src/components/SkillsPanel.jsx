import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
import AddSkill from "./AddSkill";
import CreateSkill from "./CreateSkill";
import SkillBadge from "./SkillBadge";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { categoryLabel, groupByCategory } from "../utils/skills";

// a portfolio laid out by category, which is the order the server sorts it in
function Portfolio({ skills, onRemove, removing }) {
  const groups = groupByCategory(skills);

  if (groups.length === 0) {
    return <p className="text-muted mb-0">No skills listed yet.</p>;
  }

  return (
    <div className="d-flex flex-column gap-2">
      {groups.map((group) => (
        <div key={group.category}>
          <div className="profile-field-label">
            {categoryLabel(group.category)}
          </div>
          <div className="d-flex flex-wrap gap-2">
            {group.skills.map((skill) => (
              <SkillBadge
                key={skill._id}
                skill={skill}
                onRemove={onRemove}
                removeLabel={`Remove ${skill.name}`}
                disabled={removing === skill._id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// the region under the profile itself: what this person can do. the people
// they are connected to carry their own skills on their own pages, which is
// where a skill stays attached to whoever actually has it
function SkillsPanel({ user, onChanged }) {
  const { currentUser } = useAuth();
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [removing, setRemoving] = useState(null);

  const isSelf = user._id === currentUser?._id;
  // the same rule the server's requireSelfOrAdmin applies to the portfolio routes
  const canEdit = isSelf || Boolean(currentUser?.isAdmin);

  const handleRemove = async (skill) => {
    setRemoving(skill._id);
    setError(null);
    setNotice(null);
    try {
      await api.delete(`/users/${user._id}/skills/${skill._id}`);
      onChanged?.();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          "Could not reach the server. Is it running?",
      );
    } finally {
      setRemoving(null);
    }
  };

  // a new skill goes to whoever thought of it, which on somebody else's page is
  // not the profile being read. saying so is the only sign anything happened
  const handleCreated = (name) => {
    setError(null);
    setNotice(
      isSelf
        ? `Added ${name} to your skills.`
        : `Added ${name} to the catalogue, and to your own profile.`,
    );
    onChanged?.();
  };

  return (
    <Card className="mt-4">
      <Card.Header as="h2" className="h5 mb-0">
        Skills
      </Card.Header>
      <Card.Body className="text-start">
        {error && <Alert variant="danger">{error}</Alert>}
        {notice && (
          <Alert variant="success" dismissible onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h3 className="h6 mb-0">
            {isSelf ? "Your skills" : `${user.name}'s skills`}
          </h3>
          {/* anyone signed in may add to the catalogue, wherever they are when
              they think of it; only the owner and an admin may change whose
              portfolio this is */}
          <div className="d-flex flex-wrap gap-2">
            {canEdit && <AddSkill user={user} onSkillsChanged={onChanged} />}
            <CreateSkill onSkillCreated={handleCreated} />
          </div>
        </div>

        <Portfolio
          skills={user.skills}
          onRemove={canEdit ? handleRemove : undefined}
          removing={removing}
        />
      </Card.Body>
    </Card>
  );
}

export default SkillsPanel;
