import { useCallback, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import EditUser from "../components/EditUser";
import User from "../components/User";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { DEFAULT_AVATAR, handleAvatarError } from "../utils/avatar";
import { otherEnd } from "../utils/connections";

// the message the server sent, or the fallback every page here uses when the
// request never landed
const readError = (requestError) =>
  requestError.response?.data?.message ??
  "Could not reach the server. Is it running?";

// the details keep the edit dialog's caption-over-value shape and field order,
// so the same values sit in the same places whether they're being read or
// changed. they are plain text rather than readOnly inputs: a bordered box
// invites a click and a cursor, and the Edit button is the only way in
function Field({ label, value, multiline }) {
  return (
    <div className="mb-3">
      <div className="profile-field-label">{label}</div>
      <div className={multiline ? "profile-field-multiline" : undefined}>
        {value || <span className="text-muted fst-italic">Not set</span>}
      </div>
    </div>
  );
}

function Profile() {
  const { currentUser } = useAuth();
  // seeded from the session so the card draws straight away; /users/me then
  // replaces it with the server's copy, which is what an edit made elsewhere
  // (or by an admin) would have changed
  const [user, setUser] = useState(currentUser);
  // only the requests waiting on an answer from this user, which is what the
  // server's status and direction filters narrow to
  const [requests, setRequests] = useState([]);
  // the accepted ones, in both directions: who asked whom stops mattering once
  // the request has been answered
  const [connections, setConnections] = useState([]);
  const [error, setError] = useState(null);

  const fetchMe = useCallback(async () => {
    try {
      // the id comes off the token, so this needs no parameter and always
      // answers with the signed-in user
      const response = await api.get("/users/me");
      setUser(response.data.data);
      setError(null);
    } catch (requestError) {
      setError(readError(requestError));
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      // incoming means sent to you, which is the only kind you can answer
      const response = await api.get("/connections", {
        params: { status: "pending", direction: "incoming" },
      });
      setRequests(response.data.data ?? []);
      setError(null);
    } catch (requestError) {
      setError(readError(requestError));
    }
  }, []);

  const fetchConnections = useCallback(async () => {
    try {
      const response = await api.get("/connections", {
        params: { status: "accepted" },
      });
      setConnections(response.data.data ?? []);
      setError(null);
    } catch (requestError) {
      setError(readError(requestError));
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchMe(), fetchRequests(), fetchConnections()]);
  }, [fetchConnections, fetchMe, fetchRequests]);

  // the await keeps setState out of the effect body, which the
  // react-hooks/set-state-in-effect rule flags as a cascading render
  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, [refresh]);

  // answered either way, the request is no longer pending, so it leaves the
  // column: accepting turns it into a connection the landing page shows, and
  // rejecting deletes it outright
  const handleAccept = useCallback(async (requester, connection) => {
    try {
      const response = await api.post(`/connections/${connection._id}/accept`);
      setRequests((previous) =>
        previous.filter((item) => item._id !== connection._id),
      );
      // the reply is the accepted connection with both ends populated, so it
      // crosses straight into the connections column rather than costing a
      // refetch
      setConnections((previous) => [response.data.data, ...previous]);
      setError(null);
    } catch (requestError) {
      setError(readError(requestError));
    }
  }, []);

  const handleReject = useCallback(async (requester, connection) => {
    try {
      await api.post(`/connections/${connection._id}/reject`);
      setRequests((previous) =>
        previous.filter((item) => item._id !== connection._id),
      );
      setError(null);
    } catch (requestError) {
      setError(readError(requestError));
    }
  }, []);

  return (
    <Container className="mt-5">
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        {/* three thirds, with you in the middle: who you are connected to,
            who you are, and who is still waiting on an answer */}
        <Col md={4}>
          <h2 className="h5 mb-3">Connections</h2>
          {connections.length === 0 ? (
            <p className="text-muted">No connections yet.</p>
          ) : (
            <div className="text-center">
              {connections.map((connection) => (
                <User
                  key={connection._id}
                  // either end of the pair can be the one who asked, so the
                  // card shows whichever of the two isn't you
                  user={otherEnd(connection, user?._id)}
                  currentUserId={user?._id}
                  isAdmin={user?.isAdmin}
                  connection={connection}
                  onEdit={fetchConnections}
                  onDelete={fetchConnections}
                  onImageError={handleAvatarError}
                />
              ))}
            </div>
          )}
        </Col>
        <Col md={4}>
          {user && (
            <Card>
              {/* the picture runs the full width of the card here rather than
                  being the small circle the user cards carry, and is keyed by
                  url so a changed picture starts a fresh load */}
              <Card.Img
                key={user.imageUrl || DEFAULT_AVATAR}
                variant="top"
                className="profile-image"
                src={user.imageUrl || DEFAULT_AVATAR}
                alt={user.name}
                onError={handleAvatarError}
              />
              <Card.Header as="h2" className="h5 mb-0">
                Profile
              </Card.Header>
              <Card.Body className="text-start">
                <Field label="Name" value={user.name} />
                <Field label="Username" value={user.username} />
                <Field label="Email" value={user.email} />
                <Field label="Biography" value={user.biography} multiline />
                {/* the url can run long and has no spaces to break at, so the
                    value wraps mid-word rather than stretching the column */}
                <Field label="Image URL" value={user.imageUrl} multiline />
                {user.createdAt && (
                  <div className="text-muted small">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                )}
              </Card.Body>
              {/* the dialog keeps its buttons in a footer under the fields, so
                  this one does too */}
              <Card.Footer className="d-flex justify-content-end">
                <EditUser user={user} onUserUpdated={fetchMe} />
              </Card.Footer>
            </Card>
          )}
        </Col>
        <Col md={4}>
          {/* the last column sits against the right edge of the page, so its
              heading reads from there rather than floating in from the left */}
          <h2 className="h5 mb-3 text-end">Connection Requests</h2>
          {requests.length === 0 ? (
            <p className="text-muted">No pending requests.</p>
          ) : (
            // the landing page's cards, centred the way that page centres
            // them, so a request carries the same picture, details and Feed
            // button as any other person on the site
            <div className="text-center">
              {requests.map((request) => (
                <User
                  key={request._id}
                  user={request.requester}
                  currentUserId={user?._id}
                  isAdmin={user?.isAdmin}
                  connection={request}
                  onEdit={fetchRequests}
                  onDelete={fetchRequests}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onImageError={handleAvatarError}
                />
              ))}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default Profile;
