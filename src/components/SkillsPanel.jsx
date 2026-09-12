import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
import { Link } from "react-router";
import AddSkill from "./AddSkill";
import CreateSkill from "./CreateSkill";
import SkillBadge from "./SkillBadge";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { avatarSrc, handleAvatarError } from "../utils/avatar";
import { otherEnd } from "../utils/connections";
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

// the region under the profile itself: what this person can do, and what the
// people they are connected to can do. a network is listed one person at a time
// rather than pooled, so a skill stays attached to whoever actually has it
function SkillsPanel({ user, connections = [], onChanged }) {
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

        {connections.length > 0 && (
          <>
            <hr className="my-4" />
            <h3 className="h6 mb-3">
              {isSelf
                ? "Skills in your network"
                : `Skills in ${user.name}'s network`}
            </h3>
            <div className="d-flex flex-column gap-3">
              {connections.map((connection) => {
                // whichever end of the pair isn't the person whose page this is
                const person = otherEnd(connection, user._id);
                if (!person) {
                  return null;
                }

                return (
                  <div key={connection._id}>
                    <Link
                      to={
                        person._id === currentUser?._id
                          ? "/profile"
                          : `/profile/${person._id}`
                      }
                      className="d-inline-flex align-items-center gap-2 text-reset text-decoration-none mb-2"
                    >
                      <img
                        className="author-avatar"
                        src={avatarSrc(person.imageUrl)}
                        alt=""
                        onError={handleAvatarError}
                      />
                      <span className="fw-semibold">{person.name}</span>
                    </Link>
                    <div className="d-flex flex-wrap gap-2">
                      {person.skills?.length ? (
                        person.skills.map((skill) => (
                          <SkillBadge key={skill._id} skill={skill} />
                        ))
                      ) : (
                        <span className="text-muted small">
                          No skills listed.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

export default SkillsPanel;
