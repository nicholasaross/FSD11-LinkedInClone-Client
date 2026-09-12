import { useCallback, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import EditUser from "../components/EditUser";
import ProfileSummary from "../components/ProfileSummary";
import SkillsPanel from "../components/SkillsPanel";
import User from "../components/User";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { handleAvatarError } from "../utils/avatar";
import { otherEnd } from "../utils/connections";

// the message the server sent, or the fallback every page here uses when the
// request never landed
const readError = (requestError) =>
  requestError.response?.data?.message ??
  "Could not reach the server. Is it running?";

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
          {/* the same summary a connection's page shows of them, read about
              yourself: your own address is always yours to see */}
          {user && (
            <ProfileSummary
              user={user}
              showEmail
              footer={<EditUser user={user} onUserUpdated={fetchMe} />}
            />
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
      {/* what you can do, and what the people you are connected to can do,
          under the profile the three columns above are about */}
      {user && (
        <SkillsPanel user={user} connections={connections} onChanged={refresh} />
      )}
    </Container>
  );
}

export default Profile;
