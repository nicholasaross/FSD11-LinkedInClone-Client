// the local stand-in shown for a user with no picture set
export const DEFAULT_AVATAR = "/assets/default.png";

// a stored path like "assets/microsoft/Satya Nadella.jpg" has no leading slash,
// so the browser resolves it against the page's own url: fine at "/" and
// "/feed", but on "/profile/<id>" it asks for "/profile/assets/..." and gets
// the dev server's index.html back instead of a picture. anchoring it at the
// root makes a stored path mean the same thing on every route. anything already
// absolute — a full url, a protocol-relative one, a data uri — is left alone,
// since those are what the edit form invites people to paste
export const imageSrc = (url) =>
  !url || /^([a-z][a-z0-9+.-]*:|\/)/i.test(url) ? url : `/${url}`;

// the picture to show for a user: their own if they have one, the stand-in if not
export const avatarSrc = (url) => imageSrc(url) || DEFAULT_AVATAR;

// swap in the default when a stored imageUrl fails to load; the guard stops an
// endless loop if the default itself is missing
export const handleAvatarError = (event) => {
  if (!event.target.src.endsWith(DEFAULT_AVATAR)) {
    event.target.src = DEFAULT_AVATAR;
  }
};
