import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Col, Container, Row } from "react-bootstrap";
import AddNewUser from "../components/AddNewUser";
import User from "../components/User";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { DEFAULT_AVATAR } from "../utils/avatar";
import { otherEnd } from "../utils/connections";

// swap in the local default when a stored imageUrl fails to load; the guard
// stops an endless loop if the default itself is missing
const handleImageError = (event, user) => {
  console.error(`Image failed to load for ${user.name}: ${user.imageUrl}`);
  if (!event.target.src.endsWith(DEFAULT_AVATAR)) {
    event.target.src = DEFAULT_AVATAR;
  }
};

// the message the server sent, or the fallback every page here uses when the
// request never landed
const readError = (requestError) =>
  requestError.response?.data?.message ??
  "Could not reach the server. Is it running?";

function Landing() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  // connection work is something the user asked for, so unlike the two fetches
  // its failures belong on the page rather than in the console
  const [error, setError] = useState(null);

  // the route only mounts this page when a token exists, so there is no
  // signed-out case to guard here
  const fetchUsers = useCallback(async () => {
    try {
      // responses are wrapped as { status, timestamp, data }; the list lives in data
      const response = await api.get("/users/");
      setUsers(response.data.data ?? []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  // every connection the signed-in user is part of, pending and accepted, both
  // ends populated. there is no per-user endpoint, so one list covers the page
  const fetchConnections = useCallback(async () => {
    try {
      const response = await api.get("/connections");
      setConnections(response.data.data ?? []);
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchUsers(), fetchConnections()]);
  }, [fetchConnections, fetchUsers]);

  // the await keeps setState out of the effect body, which the
  // react-hooks/set-state-in-effect rule flags as a cascading render
  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, [refresh]);

  // a connection names both people, so it is filed under whichever of them
  // isn't the signed-in user; that is the card it belongs to
  const connectionsByUserId = useMemo(() => {
    const map = new Map();
    for (const connection of connections) {
      const otherId = otherEnd(connection, currentUser?._id)?._id;
      if (otherId) {
        map.set(otherId, connection);
      }
    }
    return map;
  }, [connections, currentUser?._id]);

  // your own card lives on the profile page, which is also where its Edit
  // button went, so this page is only other people
  const otherUsers = useMemo(
    () => users.filter((user) => user._id !== currentUser?._id),
    [currentUser?._id, users],
  );

  // this page is for finding people you haven't connected with, so the ones
  // you have move over to the profile page's connections column. a request
  // still waiting on an answer isn't a connection yet, so those cards stay
  // here with the badge that says so
  const visibleUsers = useMemo(
    () =>
      otherUsers.filter(
        (user) => connectionsByUserId.get(user._id)?.status !== "accepted",
      ),
    [connectionsByUserId, otherUsers],
  );

  // the reply is the new connection with both ends populated, already the
  // shape the cards read, so it goes straight in rather than costing a refetch
  const handleConnect = useCallback(async (user) => {
    try {
      const response = await api.post("/connections", { recipient: user._id });
      setConnections((previous) => [response.data.data, ...previous]);
      setError(null);
    } catch (requestError) {
      // a 409 means a record appeared since the page loaded, in either
      // direction; the message from the server says which
      setError(readError(requestError));
    }
  }, []);

  // accepting hands back the whole updated connection, so it replaces just
  // that record and the card's badge follows
  const handleAccept = useCallback(async (user, connection) => {
    try {
      const response = await api.post(`/connections/${connection._id}/accept`);
      const updated = response.data.data;
      setConnections((previous) =>
        previous.map((item) => (item._id === updated._id ? updated : item)),
      );
      setError(null);
    } catch (requestError) {
      setError(readError(requestError));
    }
  }, []);

  // rejecting deletes the record rather than marking it, so the card goes back
  // to "not connected" and they are free to ask again
  const handleReject = useCallback(async (user, connection) => {
    try {
      await api.post(`/connections/${connection._id}/reject`);
      setConnections((previous) =>
        previous.filter((item) => item._id !== connection._id),
      );
      setError(null);
    } catch (requestError) {
      setError(readError(requestError));
    }
  }, []);

  return (
    <Container className="mt-5 text-center">
      {error && <Alert variant="danger">{error}</Alert>}
      <AddNewUser onUserAdded={fetchUsers} />
      <Row>
        {visibleUsers.length > 0 ? (
          visibleUsers.map((user) => (
            <Col key={user._id} md={4} className="mb-4">
              <User
                user={user}
                currentUserId={currentUser?._id}
                isAdmin={currentUser?.isAdmin}
                connection={connectionsByUserId.get(user._id)}
                onEdit={fetchUsers}
                // a deleted account takes its connections with it
                onDelete={refresh}
                onConnect={handleConnect}
                onAccept={handleAccept}
                onReject={handleReject}
                onImageError={handleImageError}
              />
            </Col>
          ))
        ) : (
          // an empty page reads two ways, and which one it is depends on
          // whether there was anybody to filter out in the first place
          <p>
            {otherUsers.length > 0
              ? "You are connected to everyone here."
              : "No other users found."}
          </p>
        )}
      </Row>
    </Container>
  );
}

export default Landing;
