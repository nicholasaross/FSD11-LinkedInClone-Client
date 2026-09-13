import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import DeleteRole from "./DeleteRole";
import RoleForm from "./RoleForm";
import { useAuth } from "../context/AuthContext";
import { imageSrc } from "../utils/avatar";
import { isCurrentRole, rolePeriod, roleDuration } from "../utils/roles";

// the company's mark, or its initial when there is no logo to show or the one
// on file fails to load. a square rather than the round headshots beside it:
// down a work history that is the difference between a company and a person
function CompanyLogo({ role }) {
  const [failed, setFailed] = useState(false);
  const src = imageSrc(role.companyLogoUrl);

  if (!src || failed) {
    return (
      <div
        className="role-logo role-logo-initial d-flex align-items-center justify-content-center"
        aria-hidden="true"
      >
        {role.company.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      className="role-logo"
      src={src}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}

// one line of the history. the title leads, since that is what somebody is
// being read for; the company, the months and how long they have held it follow
// in the smaller print a card of details is written in
function Role({ user, role, canEdit, onChanged, onError }) {
  const duration = roleDuration(role);

  return (
    <div className="d-flex align-items-start gap-3">
      <CompanyLogo role={role} />
      <div className="flex-grow-1 min-width-0">
        <div className="fw-semibold">{role.title}</div>
        <div>{role.company}</div>
        <div className="text-muted small">
          {rolePeriod(role)}
          {duration && ` · ${duration}`}
        </div>
      </div>
      {/* a seat somebody still holds is the thing a reader is looking for, so
          it says so rather than leaving them to work it out from "Present" */}
      <div className="d-flex align-items-center gap-2 flex-shrink-0">
        {isCurrentRole(role) && (
          <Badge bg="success" className="align-self-start">
            Current
          </Badge>
        )}
        {canEdit && (
          <>
            <RoleForm user={user} role={role} onRolesChanged={onChanged} />
            <DeleteRole
              user={user}
              role={role}
              onRoleDeleted={onChanged}
              onError={onError}
            />
          </>
        )}
      </div>
    </div>
  );
}

// the region under the profile itself: where this person has sat, and where
// they sit now. the roles ride along on the user the page already fetched, so
// there is nothing here to ask the server for until one of them is changed
function RolesPanel({ user, onChanged }) {
  const { currentUser } = useAuth();
  const [error, setError] = useState(null);

  const isSelf = user._id === currentUser?._id;
  // the same rule the server's requireSelfOrAdmin applies to the role routes
  const canEdit = isSelf || Boolean(currentUser?.isAdmin);
  // the server sorts on the way in — current roles first, then the most
  // recently begun — so this is already in the order it should be read
  const roles = user.roles ?? [];

  const handleChanged = () => {
    setError(null);
    onChanged?.();
  };

  return (
    <Card className="mt-4">
      <Card.Header as="h2" className="h5 mb-0">
        Experience
      </Card.Header>
      <Card.Body className="text-start">
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h3 className="h6 mb-0">
            {isSelf ? "Your roles" : `${user.name}'s roles`}
          </h3>
          {/* only the owner and an admin may write a history; everybody else
              signed in may read it */}
          {canEdit && <RoleForm user={user} onRolesChanged={handleChanged} />}
        </div>

        {roles.length === 0 ? (
          <p className="text-muted mb-0">No roles listed yet.</p>
        ) : (
          // ruled between rather than boxed: one card of history reads as a
          // list, where a card each would read as a stack of separate things
          <div className="d-flex flex-column">
            {roles.map((role) => (
              <div key={role._id} className="role-row">
                <Role
                  user={user}
                  role={role}
                  canEdit={canEdit}
                  onChanged={handleChanged}
                  onError={setError}
                />
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default RolesPanel;
