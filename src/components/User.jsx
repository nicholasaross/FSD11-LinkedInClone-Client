import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { Link } from "react-router";
import ConnectionActions, { ConnectionBadge } from "./ConnectionActions";
import DeleteUser from "./DeleteUser";
import EditUser from "./EditUser";
import { avatarSrc } from "../utils/avatar";
import {
  hasConnectionActions,
  isOwnAccount as isSelf,
} from "../utils/connections";

function User({
  user,
  currentUserId,
  isAdmin,
  connection,
  compact = false,
  onEdit,
  onDelete,
  onConnect,
  onAccept,
  onReject,
  onImageError,
}) {
  const isOwnAccount = isSelf(user, currentUserId);
  // requireSelfOrAdmin: you may PUT your own account, and an admin may PUT
  // anyone's. the server updates only the fields the body carries, so a
  // password and admin rights survive an edit made from this form
  const canEdit = isOwnAccount || Boolean(isAdmin);
  // admins may remove anyone; their own card keeps Edit instead, since
  // deleting yourself would pull the account out from under the session
  const canDelete = Boolean(isAdmin) && !isOwnAccount;

  // your own card leads back to your own page, which is the one that carries
  // the requests column as well
  const profilePath = isOwnAccount ? "/profile" : `/profile/${user._id}`;

  const showConnectionActions = hasConnectionActions(
    user,
    connection,
    currentUserId,
  );

  // the same two answers whichever shape the card is, only sized to fit it
  const connectionButtons = (size) => (
    <ConnectionActions
      user={user}
      connection={connection}
      currentUserId={currentUserId}
      size={size}
      onConnect={onConnect}
      onAccept={onAccept}
      onReject={onReject}
    />
  );

  // a row rather than a card: down the side of somebody's profile there may be
  // a dozen of these, and a list of faces and names is the point of that column
  if (compact) {
    return (
      <Card className="mb-2">
        <Card.Body className="d-flex align-items-center gap-3 p-2 text-start">
          <Link to={profilePath} className="flex-shrink-0">
            <img
              className="user-avatar-sm"
              src={avatarSrc(user.imageUrl)}
              alt={user.name}
              onError={(event) => onImageError?.(event, user)}
            />
          </Link>
          {/* the middle column is the one that gives way when the row is
              narrow, so a long name ellipses rather than shunting the button */}
          <div className="flex-grow-1 min-width-0">
            <Link
              to={profilePath}
              className="text-reset text-decoration-none fw-semibold d-block text-truncate"
            >
              {user.name}
            </Link>
            <div className="text-muted small text-truncate">
              {user.username}
            </div>
          </div>
          {/* whichever the state calls for: something to do about the
              connection, or the badge saying why there is nothing to do */}
          <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
            {showConnectionActions ? (
              connectionButtons("sm")
            ) : (
              <ConnectionBadge
                user={user}
                connection={connection}
                currentUserId={currentUserId}
              />
            )}
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-3">
      <Card.Body>
        {/* the picture and the name are the way into the person's own page,
            which is where the details this card no longer carries now live.
            the link has to be a block, or the anchor shrinks to the picture and
            takes the mx-auto centring with it */}
        <Link to={profilePath} className="d-block">
          <Card.Img
            className="user-avatar d-block mx-auto"
            src={avatarSrc(user.imageUrl)}
            alt={user.name}
            onError={(event) => onImageError?.(event, user)}
          />
        </Link>
        <Card.Title>
          <Link to={profilePath} className="text-reset text-decoration-none">
            {user.name}
          </Link>
        </Card.Title>
        <ConnectionBadge
          user={user}
          connection={connection}
          currentUserId={currentUserId}
          className="mb-2"
        />
        {/* the handle is all a card carries now: an address and a biography
            are things you read about somebody on their own page, and only the
            people they have accepted see the address at all */}
        <Card.Text as="div">
          <p>Username: {user.username}</p>
        </Card.Text>
        {/* what you do about the connection is its own row, ruled off from
            the rest: those buttons answer the badge above them, where Feed and
            the account buttons have nothing to do with it. the rule only
            appears when there is something to separate, since an accepted
            connection and a request you sent both leave this row empty */}
        {showConnectionActions && (
          <div className="d-flex justify-content-center flex-wrap gap-2 pb-3 mb-3 border-bottom">
            {connectionButtons()}
          </div>
        )}
        <div className="d-flex justify-content-center flex-wrap gap-2">
          {/* the same place the picture and the name lead, spelled out for
              anyone who doesn't think to click them */}
          <Button as={Link} to={profilePath} variant="outline-primary">
            Profile
          </Button>
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
