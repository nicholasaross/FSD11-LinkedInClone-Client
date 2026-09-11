import { useState } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { CiCircleCheck, CiCirclePlus, CiCircleRemove } from "react-icons/ci";
import { Link } from "react-router";
import DeleteUser from "./DeleteUser";
import EditUser from "./EditUser";
import { DEFAULT_AVATAR } from "../utils/avatar";

// the four states a card can be in, as the badge shows them. there is no
// record at all until somebody asks, so "none" is what most cards are
const BADGES = {
  accepted: { bg: "success", label: "Connected" },
  incoming: { bg: "info", text: "dark", label: "Wants to connect" },
  outgoing: { bg: "secondary", label: "Request sent" },
  none: { bg: "light", text: "secondary", label: "Not connected" },
};

// where the signed-in user stands with the person on the card. a pending
// request reads differently at each end: the person asked can answer it, the
// person who asked can only wait
function connectionStatus(connection, currentUserId) {
  if (!connection) {
    return "none";
  }
  if (connection.status === "accepted") {
    return "accepted";
  }
  return connection.recipient?._id === currentUserId ? "incoming" : "outgoing";
}

function User({
  user,
  currentUserId,
  isAdmin,
  connection,
  onEdit,
  onDelete,
  onConnect,
  onAccept,
  onReject,
  onImageError,
}) {
  // the page owns the request and the connection list; this only keeps the
  // buttons quiet while one is in flight
  const [busy, setBusy] = useState(false);

  const isOwnAccount = Boolean(currentUserId) && user._id === currentUserId;
  // requireSelfOrAdmin: you may PUT your own account, and an admin may PUT
  // anyone's. the server updates only the fields the body carries, so a
  // password and admin rights survive an edit made from this form
  const canEdit = isOwnAccount || Boolean(isAdmin);
  // admins may remove anyone; their own card keeps Edit instead, since
  // deleting yourself would pull the account out from under the session
  const canDelete = Boolean(isAdmin) && !isOwnAccount;

  const status = connectionStatus(connection, currentUserId);
  const badge = BADGES[status];
  // your own card has no connection to act on, and neither do the two states
  // that are simply waiting: an accepted connection, and a request you sent
  const showConnectionActions =
    !isOwnAccount && (status === "none" || status === "incoming");

  const run = async (action) => {
    setBusy(true);
    try {
      await action?.(user, connection);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-3">
      <Card.Body>
        <Card.Img
          className="user-avatar d-block mx-auto"
          src={user.imageUrl || DEFAULT_AVATAR}
          alt={user.name}
          onError={(event) => onImageError?.(event, user)}
        />
        <Card.Title>{user.name}</Card.Title>
        {/* your own card has nobody to be connected to */}
        {!isOwnAccount && (
          <Badge
            bg={badge.bg}
            text={badge.text}
            className={`mb-2${badge.bg === "light" ? " border" : ""}`}
          >
            {badge.label}
          </Badge>
        )}
        <Card.Text as="div">
          <p>Username: {user.username}</p>
          <p>Email: {user.email}</p>
          {user.biography && <p>{user.biography}</p>}
        </Card.Text>
        {/* what you do about the connection is its own row, ruled off from
            the rest: those buttons answer the badge above them, where Feed and
            the account buttons have nothing to do with it. the rule only
            appears when there is something to separate, since an accepted
            connection and a request you sent both leave this row empty */}
        {showConnectionActions && (
          <div className="d-flex justify-content-center flex-wrap gap-2 pb-3 mb-3 border-bottom">
            {/* asking again is only on offer when no record stands between the
                two of you, since the server answers a second request with a 409 */}
            {status === "none" && (
              <Button
                variant="primary"
                onClick={() => run(onConnect)}
                disabled={busy}
              >
                <CiCirclePlus /> Connect
              </Button>
            )}
            {/* only the person asked may answer, which the server enforces too */}
            {status === "incoming" && (
              <>
                <Button
                  variant="success"
                  onClick={() => run(onAccept)}
                  disabled={busy}
                >
                  <CiCircleCheck /> Accept
                </Button>
                {/* turning somebody down is the same shape of act as deleting
                    them, so it wears the same outline */}
                <Button
                  variant="outline-danger"
                  onClick={() => run(onReject)}
                  disabled={busy}
                >
                  <CiCircleRemove /> Reject
                </Button>
              </>
            )}
          </div>
        )}
        <div className="d-flex justify-content-center flex-wrap gap-2">
          {/* ?author= narrows the feed to this user, which is the only thing
              that reads the API's author filter */}
          <Button
            as={Link}
            to={`/feed?author=${user._id}`}
            variant="outline-primary"
          >
            Feed
          </Button>
          {canEdit && <EditUser user={user} onUserUpdated={onEdit} />}
          {canDelete && <DeleteUser user={user} onUserDeleted={onDelete} />}
        </div>
      </Card.Body>
    </Card>
  );
}

export default User;
