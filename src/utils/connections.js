// a connection names two people and the API populates both ends, so the one
// worth showing is whichever of them isn't the signed-in user. who asked whom
// still matters while a request is pending, but not to the card's picture and
// name, which is all this answers
export const otherEnd = (connection, userId) =>
  connection?.requester?._id === userId
    ? connection?.recipient
    : connection?.requester;
