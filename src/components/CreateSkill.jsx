import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { CiCirclePlus } from "react-icons/ci";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { SKILL_CATEGORIES, categoryLabel } from "../utils/skills";

const EMPTY_FORM = { name: "", category: "technical" };

// adding a skill is two things at once, and the server does both in one call:
// it joins the shared catalogue for everybody, and it goes onto the portfolio of
// whoever thought of it. that is the signed-in user, on whosever page the form
// was filled in from
function CreateSkill({ onSkillCreated }) {
  const { currentUser } = useAuth();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // a fresh form each time, so a cancelled attempt leaves nothing behind
  const handleShow = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setError(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // name and category rather than an id: the server creates the skill and
      // adds it in the one request, and hands back the whole portfolio
      const response = await api.post(`/users/${currentUser._id}/skills`, {
        name: form.name.trim(),
        category: form.category,
      });
      onSkillCreated?.(form.name.trim(), response.data.data);
      setShow(false);
    } catch (requestError) {
      // a 409 means somebody beat you to the name, in whatever casing
      setError(
        requestError.response?.data?.message ??
          "Could not reach the server. Is it running?",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="primary" onClick={handleShow}>
        <CiCirclePlus /> New skill
      </Button>
      <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false}>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>New Skill</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-start">
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3" controlId="newSkillName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleChange}
                minLength={2}
                maxLength={60}
                required
                autoFocus
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="newSkillCategory">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {SKILL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabel(category)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <p className="text-muted small mb-0">
              It joins the catalogue for everyone to add, and goes onto your own
              profile straight away.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add Skill"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

export default CreateSkill;
