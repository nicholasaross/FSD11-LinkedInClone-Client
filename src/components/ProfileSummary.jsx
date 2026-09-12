import Card from "react-bootstrap/Card";
import { avatarSrc, handleAvatarError } from "../utils/avatar";

// the details keep the edit dialog's caption-over-value shape and field order,
// so the same values sit in the same places whether they're being read or
// changed. they are plain text rather than readOnly inputs: a bordered box
// invites a click and a cursor, and the Edit button is the only way in
export function Field({ label, value, multiline }) {
  return (
    <div className="mb-3">
      <div className="profile-field-label">{label}</div>
      <div className={multiline ? "profile-field-multiline" : undefined}>
        {value || <span className="text-muted fst-italic">Not set</span>}
      </div>
    </div>
  );
}

// the summary card the profile pages share, so your own profile and a
// connection's are the same thing read about a different person. the email row
// is the one difference: it belongs to the people who have accepted each other
function ProfileSummary({ user, showEmail, heading = "Profile", footer }) {
  return (
    <Card>
      {/* the picture runs the full width of the card here rather than being
          the small circle the user cards carry, and is keyed by url so a
          changed picture starts a fresh load */}
      <Card.Img
        key={avatarSrc(user.imageUrl)}
        variant="top"
        className="profile-image"
        src={avatarSrc(user.imageUrl)}
        alt={user.name}
        onError={handleAvatarError}
      />
      <Card.Header as="h2" className="h5 mb-0">
        {heading}
      </Card.Header>
      <Card.Body className="text-start">
        <Field label="Name" value={user.name} />
        <Field label="Username" value={user.username} />
        {showEmail && <Field label="Email" value={user.email} />}
        <Field label="Biography" value={user.biography} multiline />
        {/* the url can run long and has no spaces to break at, so the value
            wraps mid-word rather than stretching the column */}
        <Field label="Image URL" value={user.imageUrl} multiline />
        {user.createdAt && (
          <div className="text-muted small">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </div>
        )}
      </Card.Body>
      {/* the dialog keeps its buttons in a footer under the fields, so this
          one does too */}
      {footer && (
        <Card.Footer className="d-flex justify-content-end">{footer}</Card.Footer>
      )}
    </Card>
  );
}

export default ProfileSummary;
