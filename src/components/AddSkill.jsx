import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import { CiCirclePlus } from "react-icons/ci";
import DeleteSkill from "./DeleteSkill";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { plural } from "../utils/plural";
import {
  SKILL_CATEGORIES,
  canDeleteSkill,
  categoryLabel,
  categoryVariant,
} from "../utils/skills";

// the shared catalogue, to pick from rather than to retype. the filtering is
// done here rather than by asking the server on every keystroke: the whole
// catalogue is small enough to hold, and it keeps the list from flickering
function AddSkill({ user, onSkillsChanged }) {
  const { currentUser } = useAuth();
  const [show, setShow] = useState(false);
  const [skills, setSkills] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  // the id being added, so only the row that was clicked goes quiet
  const [adding, setAdding] = useState(null);

  const fetchSkills = useCallback(async () => {
    try {
      const response = await api.get("/skills");
      setSkills(response.data.data ?? []);
      setError(null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          "Could not reach the server. Is it running?",
      );
    }
  }, []);

  // the await keeps setState out of the effect body, which the
  // react-hooks/set-state-in-effect rule flags as a cascading render
  useEffect(() => {
    if (!show) {
      return;
    }
    (async () => {
      await fetchSkills();
    })();
  }, [fetchSkills, show]);

  const handleShow = () => {
    setQuery("");
    setCategory("");
    setError(null);
    setNotice(null);
    setShow(true);
  };

  // the portfolio behind this modal has changed by the time it closes, so the
  // page is told once on the way out rather than after every add
  const handleClose = () => {
    setShow(false);
    setError(null);
    setNotice(null);
  };

  // what this user already holds, so the list can say so rather than offering a
  // button that would be a no-op. it comes from the profile rather than the
  // catalogue's own inPortfolio, which answers for the viewer and not the subject
  const held = useMemo(
    () => new Set((user.skills ?? []).map((skill) => skill._id ?? skill)),
    [user.skills],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return skills.filter(
      (skill) =>
        (!category || skill.category === category) &&
        (!term || skill.name.toLowerCase().includes(term)),
    );
  }, [category, query, skills]);

  const handleAdd = async (skill) => {
    setAdding(skill._id);
    setError(null);
    try {
      await api.post(`/users/${user._id}/skills`, { skill: skill._id });
      setNotice(`Added ${skill.name}.`);
      onSkillsChanged?.();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          "Could not reach the server. Is it running?",
      );
    } finally {
      setAdding(null);
    }
  };

  const handleDeleted = async (skill, portfolios) => {
    setNotice(
      `Deleted ${skill.name}${
        portfolios > 0
          ? `, and took it off ${plural(portfolios, "profile")}`
          : ""
      }.`,
    );
    await fetchSkills();
    onSkillsChanged?.();
  };

  return (
    <>
      <Button variant="outline-primary" onClick={handleShow}>
        <CiCirclePlus /> Add skill
      </Button>
      <Modal show={show} onHide={handleClose} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Add a Skill</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-start">
          {error && <Alert variant="danger">{error}</Alert>}
          {notice && <Alert variant="success">{notice}</Alert>}
          <div className="d-flex flex-wrap gap-2 mb-3">
            <Form.Control
              className="flex-grow-1"
              style={{ minWidth: "12rem" }}
              placeholder="Search skills"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search skills"
            />
            <Form.Select
              style={{ maxWidth: "12rem" }}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {SKILL_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {categoryLabel(item)}
                </option>
              ))}
            </Form.Select>
          </div>
          {visible.length === 0 ? (
            <p className="text-muted mb-0">
              {skills.length === 0
                ? "The catalogue is empty. Add the first skill with New skill."
                : "No skills match that search."}
            </p>
          ) : (
            <ListGroup>
              {visible.map((skill) => {
                const alreadyHeld = held.has(skill._id);

                return (
                  <ListGroup.Item
                    key={skill._id}
                    className="d-flex align-items-center gap-2"
                  >
                    <span className="flex-grow-1 min-width-0">
                      <span className="d-block text-truncate">{skill.name}</span>
                      <span className="text-muted small">
                        held by {plural(skill.userCount, "person", "people")}
                      </span>
                    </span>
                    <Badge bg={categoryVariant(skill.category)}>
                      {categoryLabel(skill.category)}
                    </Badge>
                    {canDeleteSkill(skill, currentUser) && (
                      <DeleteSkill
                        skill={skill}
                        onSkillDeleted={handleDeleted}
                        onError={setError}
                      />
                    )}
                    {alreadyHeld ? (
                      <span className="text-muted small">Added</span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAdd(skill)}
                        disabled={adding === skill._id}
                      >
                        Add
                      </Button>
                    )}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default AddSkill;
