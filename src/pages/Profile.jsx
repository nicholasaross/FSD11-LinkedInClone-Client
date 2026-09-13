import { useCallback, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import EditUser from "../components/EditUser";
import ProfileSummary from "../components/ProfileSummary";
import RolesPanel from "../components/RolesPanel";
import SkillsPanel from "../components/SkillsPanel";
import User from "../components/User";
import { useAuth } from "../context/AuthContext";
import { useConnections } from "../context/ConnectionsContext";
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
  // the two columns on the right are cuts of the one shared list: the requests
  // waiting on an answer from you, and the ones already answered. the answers
  // themselves come from the same place, so a request accepted here leaves the
  // top column and joins the one below it without either being refetched
  const {
    accepted,
    incomingRequests,
    error: connectionError,
    refresh: refreshConnections,
    accept,
    reject,
  } = useConnections();
  // seeded from the session so the card draws straight away; /users/me then
  // replaces it with the server's copy, which is what an edit made elsewhere
  // (or by an admin) would have changed
  const [user, setUser] = useState(currentUser);
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

  // the await keeps setState out of the effect body, which the
  // react-hooks/set-state-in-effect rule flags as a cascading render
  useEffect(() => {
    (async () => {
      await fetchMe();
    })();
  }, [fetchMe]);

  return (
    <Container className="mt-5">
      {/* your own record and the connection work fail separately, but there is
          only ever one thing to say about the page at a time */}
      {(error || connectionError) && (
        <Alert variant="danger">{error ?? connectionError}</Alert>
      )}
      <Row>
        {/* the two halves a connection's page has, read about yourself: who
            you are on the left, and everybody else on the right */}
        <Col md={6}>
          {/* the same summary a connection's page shows of them: your own
              address is always yours to see */}
          {user && (
            <ProfileSummary
              user={user}
              showEmail
              footer={<EditUser user={user} onUserUpdated={fetchMe} />}
            />
          )}
        </Col>
        <Col md={6}>
          {/* the people still waiting on an answer come first: a request is
              something to do, where a connection is only something to read.
              both columns sit against the right edge of the page, so their
              headings read from there rather than floating in from the left */}
          <h2 className="h5 mb-3 text-end">Connection Requests</h2>
          {incomingRequests.length === 0 ? (
            <p className="text-muted">No pending requests.</p>
          ) : (
            // the row-shaped cards a connection's page lists people with, since
            // this column is now a list of faces and names rather than a third
            // of the page given over to one card each
            <div className="mb-4">
              {incomingRequests.map((request) => (
                <User
                  key={request._id}
                  compact
                  user={request.requester}
                  currentUserId={user?._id}
                  isAdmin={user?.isAdmin}
                  connection={request}
                  onEdit={refreshConnections}
                  onDelete={refreshConnections}
                  onAccept={accept}
                  onReject={reject}
                  onImageError={handleAvatarError}
                />
              ))}
            </div>
          )}
          <h2 className="h5 mb-3 text-end">Connections</h2>
          {accepted.length === 0 ? (
            <p className="text-muted">No connections yet.</p>
          ) : (
            <div>
              {accepted.map((connection) => (
                <User
                  key={connection._id}
                  compact
                  // either end of the pair can be the one who asked, so the
                  // card shows whichever of the two isn't you
                  user={otherEnd(connection, user?._id)}
                  currentUserId={user?._id}
                  isAdmin={user?.isAdmin}
                  connection={connection}
                  onEdit={refreshConnections}
                  onDelete={refreshConnections}
                  onImageError={handleAvatarError}
                />
              ))}
            </div>
          )}
        </Col>
      </Row>
      {/* where you have sat and what you can do, under the profile the two
          columns above are about. both ride along on your own record, so both
          are changed by asking for that record again */}
      {user && (
        <>
          <RolesPanel user={user} onChanged={fetchMe} />
          <SkillsPanel user={user} onChanged={fetchMe} />
        </>
      )}
    </Container>
  );
}

export default Profile;
