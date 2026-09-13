import { useState } from "react";
import Button from "react-bootstrap/Button";
import { CiTrash } from "react-icons/ci";
import api from "../api/axios";

// a role exists only inside the person who held it, so taking one off reaches
// no further than their own history. the confirmation is spelt out in the row
// rather than in a modal, the way deleting a skill asks: the question is small
// enough to answer where it stands
function DeleteRole({ user, role, onRoleDeleted, onError }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/users/${user._id}/roles/${role._id}`);
      setConfirming(false);
      onRoleDeleted?.(role);
    } catch (requestError) {
      // the server re-checks whose history this is, so a 403 lands here
      onError?.(
        requestError.response?.data?.message ??
          "Could not reach the server. Is it running?",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!confirming) {
    return (
      <Button
        variant="outline-danger"
        size="sm"
        title={`Remove ${role.title}`}
        onClick={() => setConfirming(true)}
      >
        <CiTrash />
      </Button>
    );
  }

  return (
    <span className="d-inline-flex align-items-center gap-2">
      <span className="text-danger small">Remove?</span>
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={() => setConfirming(false)}
        disabled={deleting}
      >
        No
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? "..." : "Yes"}
      </Button>
    </span>
  );
}

export default DeleteRole;
