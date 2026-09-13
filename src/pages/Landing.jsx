import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Col, Container, Row } from "react-bootstrap";
import AddNewUser from "../components/AddNewUser";
import User from "../components/User";
import { useAuth } from "../context/AuthContext";
import { useConnections } from "../context/ConnectionsContext";
import api from "../api/axios";
import { DEFAULT_AVATAR } from "../utils/avatar";

// swap in the local default when a stored imageUrl fails to load; the guard
// stops an endless loop if the default itself is missing
const handleImageError = (event, user) => {
  console.error(`Image failed to load for ${user.name}: ${user.imageUrl}`);
  if (!event.target.src.endsWith(DEFAULT_AVATAR)) {
    event.target.src = DEFAULT_AVATAR;
  }
};

function Landing() {
  const { currentUser } = useAuth();
  // the list, the map filed by person, and the three answers, all from the one
  // place that keeps them: this page reads the same records the profile pages
  // do, so answering a request here is answered there too
  const {
    byUserId,
    error,
    refresh: refreshConnections,
    connect,
    accept,
    reject,
  } = useConnections();
  const [users, setUsers] = useState([]);

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

  // the await keeps setState out of the effect body, which the
  // react-hooks/set-state-in-effect rule flags as a cascading render
  useEffect(() => {
    (async () => {
      await fetchUsers();
    })();
  }, [fetchUsers]);

  // a deleted account takes its connections with it, so both lists are asked
  // for again
  const refresh = useCallback(async () => {
    await Promise.all([fetchUsers(), refreshConnections()]);
  }, [fetchUsers, refreshConnections]);

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
        (user) => byUserId.get(user._id)?.status !== "accepted",
      ),
    [byUserId, otherUsers],
  );

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
                connection={byUserId.get(user._id)}
                onEdit={fetchUsers}
                onDelete={refresh}
                onConnect={connect}
                onAccept={accept}
                onReject={reject}
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
