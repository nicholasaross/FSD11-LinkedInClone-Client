import { useState } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import { CiCircleCheck, CiCirclePlus, CiCircleRemove } from "react-icons/ci";
import {
  connectionStatus,
  hasConnectionActions,
  isOwnAccount,
} from "../utils/connections";

// the four states a person can be in, as the badge shows them. there is no
// record at all until somebody asks, so "none" is what most people are
const BADGES = {
  accepted: { bg: "success", label: "Connected" },
  incoming: { bg: "info", text: "dark", label: "Wants to connect" },
  outgoing: { bg: "secondary", label: "Request sent" },
  none: { bg: "light", text: "secondary", label: "Not connected" },
};

// what the badge says is the answer to what the buttons offer, so the two live
// in one file: whenever there is nothing to do about a connection, this is what
// says why
export function ConnectionBadge({
  user,
  connection,
  currentUserId,
  className,
}) {
  if (isOwnAccount(user, currentUserId)) {
    return null;
  }

  const badge = BADGES[connectionStatus(connection, currentUserId)];

  return (
    <Badge
      bg={badge.bg}
      text={badge.text}
      className={
        badge.bg === "light" ? `border ${className ?? ""}`.trim() : className
      }
    >
      {badge.label}
    </Badge>
  );
}

// the buttons themselves, wherever the person is being shown: a card in a grid,
// a row down the side of a profile, or the footer of their own profile summary
function ConnectionActions({
  user,
  connection,
  currentUserId,
  size,
  onConnect,
  onAccept,
  onReject,
}) {
  // the page owns the request and the connection list; this only keeps the
  // buttons quiet while one is in flight
  const [busy, setBusy] = useState(false);

  const status = connectionStatus(connection, currentUserId);

  const run = async (action) => {
    setBusy(true);
    try {
      await action?.(user, connection);
    } finally {
      setBusy(false);
    }
  };

  if (!hasConnectionActions(user, connection, currentUserId)) {
    return null;
  }

  return (
    <>
      {/* asking again is only on offer when no record stands between the two
          of you, since the server answers a second request with a 409 */}
      {status === "none" && (
        <Button
          variant="primary"
          size={size}
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
            size={size}
            onClick={() => run(onAccept)}
            disabled={busy}
          >
            <CiCircleCheck /> Accept
          </Button>
          {/* turning somebody down is the same shape of act as deleting them,
              so it wears the same outline */}
          <Button
            variant="outline-danger"
            size={size}
            onClick={() => run(onReject)}
            disabled={busy}
          >
            <CiCircleRemove /> Reject
          </Button>
        </>
      )}
    </>
  );
}

export default ConnectionActions;
