import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { Link, Navigate, useParams } from "react-router";
import ConnectionActions, {
  ConnectionBadge,
} from "../components/ConnectionActions";
import EditUser from "../components/EditUser";
import ProfileSummary from "../components/ProfileSummary";
import SkillsPanel from "../components/SkillsPanel";
import User from "../components/User";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { handleAvatarError } from "../utils/avatar";
import { connectionFromUserState, otherEnd } from "../utils/connections";

// the message the server sent, or the fallback every page here uses when the
// request never landed
const readError = (requestError) =>
  requestError.response?.data?.message ??
  "Could not reach the server. Is it running?";

// one other person's page. how much of it there is depends on where the signed-in
// user stands with them: a stranger is a card and a biography, someone who has
// accepted you is the same summary you see of yourself, their address included,
// next to the people they are connected to. their pending requests are theirs
// alone, so this page never has the third column the signed-in user's does
function PersonProfile() {
  const { id } = useParams();
  const { currentUser } = useAuth();

  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  // your own, which is how each card in their list knows where you stand with
  // that person: the list itself says nothing about you
  const [myConnections, setMyConnections] = useState([]);
  const [error, setError] = useState(null);
  // tells "still loading" apart from "there is nobody here", which read the
  // same while user is null
  const [loaded, setLoaded] = useState(false);

  const isSelf = id === currentUser?._id;

  // the server only answers this for the people in the network, so it is only
  // worth asking once the first call says the two of you have accepted
  const fetchTheirConnections = useCallback(async () => {
    try {
      const response = await api.get(`/users/${id}/connections`);
      return response.data.data ?? [];
    } catch (requestError) {
      console.error("Error fetching connections:", requestError);
      return [];
    }
  }, [id]);

  // pending as well as accepted, unfiltered: the cards read every state
  const fetchMyConnections = useCallback(async () => {
    try {
      const response = await api.get("/connections");
      return response.data.data ?? [];
    } catch (requestError) {
      console.error("Error fetching your connections:", requestError);
      return [];
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      // one call answers most of the page: the server decorates the user with
      // connectionStatus and connectionId, which is both how the card's buttons
      // behave and whether the address is on show
      const response = await api.get(`/users/${id}`);
      const fetched = response.data.data;
      // the other two hang off this one's answer, so they all land together
      // rather than the page redrawing twice
      const [theirs, mine] =
        fetched.connectionStatus === "accepted"
          ? await Promise.all([fetchTheirConnections(), fetchMyConnections()])
          : [[], []];

      setUser(fetched);
      setConnections(theirs);
      setMyConnections(mine);
      setError(null);
    } catch (requestError) {
      setUser(null);
      setConnections([]);
      setMyConnections([]);
      setError(readError(requestError));
    } finally {
      setLoaded(true);
    }
  }, [fetchMyConnections, fetchTheirConnections, id]);

  // the await keeps setState out of the effect body, which the
  // react-hooks/set-state-in-effect rule flags as a cascading render
  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, [refresh]);

  const isConnected = user?.connectionStatus === "accepted";

  // the card reads a populated connection; the user endpoint hands back the
  // flat pair instead, so it is shaped into one here
  const connection = useMemo(
    () => connectionFromUserState(user, currentUser?._id),
    [currentUser?._id, user],
  );

  // a connection of yours names both people, so it is filed under whichever of
  // them isn't you: that is the card in their list it belongs to. the same map
  // the landing page builds, for the same reason
  const myConnectionByUserId = useMemo(() => {
    const map = new Map();
    for (const item of myConnections) {
      const otherId = otherEnd(item, currentUser?._id)?._id;
      if (otherId) {
        map.set(otherId, item);
      }
    }
    return map;
  }, [currentUser?._id, myConnections]);

  // asking, and answering a request they sent you, both change where you stand
  // with them, which is the whole shape of this page: refetching redraws it
  // rather than trying to patch each piece that moved
  // the card hands back whoever it is showing, which is this person on their
  // own page and somebody out of their list in the column beside it
  const handleConnect = useCallback(
    async (person) => {
      try {
        await api.post("/connections", { recipient: person._id });
        await refresh();
      } catch (requestError) {
        setError(readError(requestError));
      }
    },
    [refresh],
  );

  const handleAccept = useCallback(
    async (_person, accepted) => {
      try {
        await api.post(`/connections/${accepted._id}/accept`);
        await refresh();
      } catch (requestError) {
        setError(readError(requestError));
      }
    },
    [refresh],
  );

  const handleReject = useCallback(
    async (_person, rejected) => {
      try {
        await api.post(`/connections/${rejected._id}/reject`);
        await refresh();
      } catch (requestError) {
        setError(readError(requestError));
      }
    },
    [refresh],
  );

  // the same footer whether or not you are connected, so the two versions of
  // this page are one page showing more or less of somebody: where you stand
  // with them on the left, what you can do about it on the right
  const summaryFooter = user && (
    <div className="d-flex align-items-center justify-content-between w-100 gap-2">
      <ConnectionBadge
        user={user}
        connection={connection}
        currentUserId={currentUser?._id}
      />
      <div className="d-flex flex-wrap justify-content-end gap-2">
        <ConnectionActions
          user={user}
          connection={connection}
          currentUserId={currentUser?._id}
          onConnect={handleConnect}
          onAccept={handleAccept}
          onReject={handleReject}
        />
        {/* ?author= narrows the feed to this user, the same way the cards do */}
        <Button
          as={Link}
          to={`/feed?author=${user._id}`}
          variant="outline-primary"
        >
          Feed
        </Button>
        {currentUser?.isAdmin && (
          <EditUser user={user} onUserUpdated={refresh} />
        )}
      </div>
    </div>
  );

  // your own page is the other one, which has the requests column this hasn't
  if (isSelf) {
    return <Navigate to="/profile" replace />;
  }

  if (!user) {
    return (
      <Container className="mt-5">
        {error && <Alert variant="danger">{error}</Alert>}
        {loaded && !error && <p className="text-muted">User not found.</p>}
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      {error && <Alert variant="danger">{error}</Alert>}
      {isConnected ? (
        <Row>
          {/* two halves rather than the three thirds of your own page: who they
              are, and who they are connected to. who has asked to connect with
              them is between them and whoever asked */}
          <Col md={6}>
            <ProfileSummary user={user} showEmail footer={summaryFooter} />
          </Col>
          <Col md={6}>
            {/* this column sits against the right edge of the page, so its
                heading reads from there rather than floating in from the left,
                the way your own page's last column does */}
            <h2 className="h5 mb-3 text-end">Connections</h2>
            {connections.length === 0 ? (
              <p className="text-muted">No connections yet.</p>
            ) : (
              <div>
                {connections.map((item) => {
                  // whichever end of the pair isn't the person whose page this
                  // is, which is not the same as whichever isn't you
                  const person = otherEnd(item, user._id);
                  if (!person) {
                    return null;
                  }

                  return (
                    <User
                      key={item._id}
                      compact
                      user={person}
                      // still the viewer's, so where you stand with them, and
                      // what you may do about it, stays yours and not theirs
                      currentUserId={currentUser?._id}
                      isAdmin={currentUser?.isAdmin}
                      connection={myConnectionByUserId.get(person._id)}
                      onEdit={refresh}
                      onDelete={refresh}
                      onConnect={handleConnect}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onImageError={handleAvatarError}
                    />
                  );
                })}
              </div>
            )}
          </Col>
        </Row>
      ) : (
        <Row>
          {/* the same summary a connection gets, in the middle of the page
              because there is no network of theirs to set beside it yet. their
              address is the one thing held back until you are connected */}
          <Col md={6} className="mx-auto">
            <ProfileSummary user={user} footer={summaryFooter} />
          </Col>
        </Row>
      )}
      {/* under the profile either way: what they can do, and what the people
          they are connected to can do. a stranger's network is not on show, so
          that half is simply absent until you are connected */}
      <SkillsPanel user={user} connections={connections} onChanged={refresh} />
    </Container>
  );
}

export default PersonProfile;
