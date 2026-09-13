import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";
import { ConnectionsContext } from "./ConnectionsContext";
import { connectionStatus, otherEnd } from "../utils/connections";

// the message the server sent, or the fallback every page here uses when the
// request never landed
const readError = (requestError) =>
  requestError.response?.data?.message ??
  "Could not reach the server. Is it running?";

// who the signed-in user is connected to, asked once for the whole session
// rather than by each page that shows people. every page used to keep its own
// copy and its own accept/reject handlers, so answering a request in one place
// left the others reading a list that was no longer true
export function ConnectionsProvider({ children }) {
  const { currentUser, token } = useAuth();
  // pending as well as accepted, in both directions, both ends populated:
  // there is no per-user endpoint, so one list answers every page. the filtered
  // views below are cut from it rather than asked for separately
  const [connections, setConnections] = useState([]);
  // connection work is something the user asked for, so unlike the fetch its
  // failures belong on the page rather than in the console
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    // signed out there is nothing to ask for, and the list from the last
    // session has to go with them
    if (!token) {
      setConnections([]);
      return;
    }
    try {
      const response = await api.get("/connections");
      setConnections(response.data.data ?? []);
    } catch (requestError) {
      console.error("Error fetching connections:", requestError);
    }
  }, [token]);

  // the await keeps setState out of the effect body, which the
  // react-hooks/set-state-in-effect rule flags as a cascading render
  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, [refresh]);

  // the three answers a page can give about a connection. each takes the pair
  // the user card hands its callbacks — (person, connection) — so a page can
  // pass these straight to a <User> without writing an adapter round them.
  // asking needs the person, answering needs the connection
  const connect = useCallback(async (person) => {
    try {
      // the reply is the new connection with both ends populated, already the
      // shape the cards read, so it goes straight in rather than costing a
      // refetch
      const response = await api.post("/connections", {
        recipient: person._id,
      });
      setConnections((previous) => [response.data.data, ...previous]);
      setError(null);
    } catch (requestError) {
      // a 409 means a record appeared since the page loaded, in either
      // direction; the message from the server says which
      setError(readError(requestError));
    }
  }, []);

  // accepting hands back the whole updated connection, so it replaces just
  // that record and every list cut from it follows: the card's badge on one
  // page, and the request crossing from one column to the other on another
  const accept = useCallback(async (_person, connection) => {
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
  const reject = useCallback(async (_person, connection) => {
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

  // a connection names both people, so it is filed under whichever of them
  // isn't the signed-in user; that is the card it belongs to. both the landing
  // page and a person's page used to build this map for themselves
  const byUserId = useMemo(() => {
    const map = new Map();
    for (const connection of connections) {
      const otherId = otherEnd(connection, currentUser?._id)?._id;
      if (otherId) {
        map.set(otherId, connection);
      }
    }
    return map;
  }, [connections, currentUser?._id]);

  // the two cuts the profile page shows as columns. the server can filter by
  // status and direction, but asking it twice over would be two more copies of
  // a list already in hand
  const accepted = useMemo(
    () => connections.filter((connection) => connection.status === "accepted"),
    [connections],
  );

  // sent to you, which is the only kind you can answer
  const incomingRequests = useMemo(
    () =>
      connections.filter(
        (connection) =>
          connectionStatus(connection, currentUser?._id) === "incoming",
      ),
    [connections, currentUser?._id],
  );

  const value = useMemo(
    () => ({
      connections,
      byUserId,
      accepted,
      incomingRequests,
      error,
      refresh,
      connect,
      accept,
      reject,
    }),
    [
      accept,
      accepted,
      byUserId,
      connect,
      connections,
      error,
      incomingRequests,
      refresh,
      reject,
    ],
  );

  return (
    <ConnectionsContext.Provider value={value}>
      {children}
    </ConnectionsContext.Provider>
  );
}
