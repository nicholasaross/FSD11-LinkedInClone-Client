import { useState } from "react";
import Button from "react-bootstrap/Button";
import { CiTrash } from "react-icons/ci";
import api from "../api/axios";

// the only destructive act here that reaches past the person doing it: the skill
// leaves the catalogue and every portfolio holding it. the confirmation is spelt
// out in the row rather than in a modal, since this already lives inside one and
// stacking them would bury the question
function DeleteSkill({ skill, onSkillDeleted, onError }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await api.delete(`/skills/${skill._id}`);
      setConfirming(false);
      // the reply counts the portfolios it was pulled from, which is the part
      // worth saying out loud
      onSkillDeleted?.(skill, response.data.data?.removed?.portfolios ?? 0);
    } catch (requestError) {
      // the server re-checks who added it, so a 403 lands here
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
        title={`Delete ${skill.name} from the catalogue`}
        onClick={() => setConfirming(true)}
      >
        <CiTrash />
      </Button>
    );
  }

  return (
    <span className="d-inline-flex align-items-center gap-2">
      <span className="text-danger small">Delete for everyone?</span>
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

export default DeleteSkill;
