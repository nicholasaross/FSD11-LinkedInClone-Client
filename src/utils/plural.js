// "1 like" / "2 likes" — shared by the post and comment like labels. a noun that
// doesn't just take an s ("person" / "people") passes its own plural
export const plural = (count, noun, many) =>
  `${count} ${count === 1 ? noun : (many ?? `${noun}s`)}`;
