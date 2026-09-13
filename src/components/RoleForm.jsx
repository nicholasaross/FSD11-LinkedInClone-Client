import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { CiCirclePlus, CiEdit } from "react-icons/ci";
import api from "../api/axios";
import { MONTH_PATTERN, currentMonth, isCurrentRole } from "../utils/roles";

// a role carries the same five fields whether it is being written down for the
// first time or corrected afterwards, so one dialog does both: the absence of a
// role is what makes it an addition. the server agrees, taking the same body at
// POST /users/:id/roles and PUT /users/:id/roles/:roleId
function buildForm(role) {
  return {
    title: role?.title ?? "",
    company: role?.company ?? "",
    companyLogoUrl: role?.companyLogoUrl ?? "",
    start: role?.start ?? "",
    end: role?.end ?? "",
    // a role being written down for the first time is usually one somebody has
    // just taken up, so it starts as current
    current: role ? isCurrentRole(role) : true,
  };
}

function RoleForm({ user, role, onRolesChanged }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(() => buildForm(role));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(role);
  // a role cannot begin or end after this month, which the server checks too
  const thisMonth = currentMonth();

  // re-seed each time the dialog opens so a cancelled edit doesn't leave stale
  // values behind, the same way the account form does
  const handleShow = () => {
    setForm(buildForm(role));
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

  // ticking the box is what makes a role current, so it clears the month that
  // would say otherwise rather than leaving a value the submit has to ignore
  const handleCurrentChange = (event) => {
    const { checked } = event.target;
    setForm((previous) => ({
      ...previous,
      current: checked,
      end: checked ? "" : previous.end,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title: form.title,
      company: form.company,
      // empty means no logo, which is how the server reads it on the way in
      companyLogoUrl: form.companyLogoUrl.trim(),
      start: form.start,
      // null is an answer here and not a silence: it is how a role says it is
      // one the person still holds
      end: form.current ? null : form.end,
    };

    try {
      // either way the reply is the whole history in display order, but the
      // panel reads roles off the user it already has, so it asks for that
      // again rather than taking the list from here
      if (isEdit) {
        await api.put(`/users/${user._id}/roles/${role._id}`, payload);
      } else {
        await api.post(`/users/${user._id}/roles`, payload);
      }
      onRolesChanged?.();
      setShow(false);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          "Could not reach the server. Is it running?",
      );
    } finally {
      setSaving(false);
    }
  };

  // the id has to be unique on the page: a profile shows several of these at
  // once, one per role, and the add dialog alongside them
  const fieldId = (field) => `role-${field}-${role?._id ?? `new-${user._id}`}`;

  return (
    <>
      {isEdit ? (
        <Button
          variant="outline-primary"
          size="sm"
          title={`Edit ${role.title}`}
          onClick={handleShow}
        >
          <CiEdit />
        </Button>
      ) : (
        <Button variant="outline-primary" onClick={handleShow}>
          <CiCirclePlus /> Add role
        </Button>
      )}
      <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false}>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{isEdit ? "Edit Role" : "Add a Role"}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-start">
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3" controlId={fieldId("title")}>
              <Form.Label>Title</Form.Label>
              <Form.Control
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Board Member"
                minLength={2}
                maxLength={100}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId={fieldId("company")}>
              <Form.Label>Company</Form.Label>
              <Form.Control
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="Microsoft"
                minLength={2}
                maxLength={100}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId={fieldId("logo")}>
              <Form.Label>Company Logo URL</Form.Label>
              <Form.Control
                name="companyLogoUrl"
                value={form.companyLogoUrl}
                onChange={handleChange}
                placeholder="assets/ms-logo.png"
              />
              <Form.Text muted>
                A path this site serves, like assets/ms-logo.png, or a full
                address. Clear it to fall back to the company initial.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3" controlId={fieldId("start")}>
              <Form.Label>Start</Form.Label>
              {/* type=month gives a picker that can only produce YYYY-MM, which
                  is exactly what the server takes. a browser without one falls
                  back to a text box, so the pattern and the placeholder are
                  there to hold that case to the same shape */}
              <Form.Control
                type="month"
                name="start"
                value={form.start}
                onChange={handleChange}
                max={thisMonth}
                pattern={MONTH_PATTERN}
                placeholder="YYYY-MM"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId={fieldId("current")}>
              <Form.Check
                type="checkbox"
                name="current"
                checked={form.current}
                onChange={handleCurrentChange}
                label="Still in this role"
              />
            </Form.Group>
            {/* the end month has nothing to say about a current role, so it is
                out of the way rather than sitting there disabled */}
            {!form.current && (
              <Form.Group controlId={fieldId("end")}>
                <Form.Label>End</Form.Label>
                <Form.Control
                  type="month"
                  name="end"
                  value={form.end}
                  onChange={handleChange}
                  min={form.start || undefined}
                  max={thisMonth}
                  pattern={MONTH_PATTERN}
                  placeholder="YYYY-MM"
                  required
                />
                <Form.Text muted>An end cannot come before the start.</Form.Text>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Role"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

export default RoleForm;
