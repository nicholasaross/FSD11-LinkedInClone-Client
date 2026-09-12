// a connection names two people and the API populates both ends, so the one
// worth showing is whichever of them isn't the signed-in user. who asked whom
// still matters while a request is pending, but not to the card's picture and
// name, which is all this answers
export const otherEnd = (connection, userId) =>
  connection?.requester?._id === userId
    ? connection?.recipient
    : connection?.requester;

// where the signed-in user stands with somebody. a pending request reads
// differently at each end: the person asked can answer it, the person who
// asked can only wait
export const connectionStatus = (connection, currentUserId) => {
  if (!connection) {
    return "none";
  }
  if (connection.status === "accepted") {
    return "accepted";
  }
  return connection.recipient?._id === currentUserId ? "incoming" : "outgoing";
};

// your own card and your own page have nobody to be connected to
export const isOwnAccount = (user, currentUserId) =>
  Boolean(currentUserId) && user?._id === currentUserId;

// whether there is anything to do about the connection at all: your own account
// aside, an accepted connection and a request you sent are both simply waiting
export const hasConnectionActions = (user, connection, currentUserId) => {
  const status = connectionStatus(connection, currentUserId);
  return (
    !isOwnAccount(user, currentUserId) &&
    (status === "none" || status === "incoming")
  );
};

// the user endpoints don't return the connection itself, they decorate a user
// with the flat connectionId/connectionStatus pair describing how the viewer
// stands with them. the user card reads a populated connection instead, so a
// page built on a single /users/:id call shapes one from those two fields.
// only the id, the status and the recipient are read, which is all this fills in
export const connectionFromUserState = (user, viewerId) => {
  if (!user?.connectionId) {
    return undefined;
  }

  const accepted = user.connectionStatus === "accepted";

  return {
    _id: user.connectionId,
    status: accepted ? "accepted" : "pending",
    // the card tells an answerable request from a waiting one by asking who
    // the recipient is, so a request sent to the viewer names the viewer
    recipient: {
      _id:
        user.connectionStatus === "pendingIncoming" ? viewerId : user._id,
    },
    requester: {
      _id:
        user.connectionStatus === "pendingIncoming" ? user._id : viewerId,
    },
  };
};
