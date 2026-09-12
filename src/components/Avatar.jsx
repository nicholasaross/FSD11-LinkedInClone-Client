import { avatarSrc, handleAvatarError } from "../utils/avatar";

// the small round picture beside a post or comment author's name. alt is empty
// on purpose: the name sits right next to it, so the picture is decorative and
// a screen reader would only read the name twice.
function Avatar({ src }) {
  return (
    <img
      className="author-avatar"
      src={avatarSrc(src)}
      alt=""
      onError={handleAvatarError}
    />
  );
}

export default Avatar;
