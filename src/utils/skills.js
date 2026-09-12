// the three buckets the server's enum allows, in the order it sorts them
export const SKILL_CATEGORIES = ["technical", "business", "extreme"];

// what each bucket is called on screen, and the colour it wears. the hues carry
// the meaning rather than decorate it: blue for the trade, green for the
// business of it, red for the things people do at weekends and shouldn't
export const CATEGORIES = {
  technical: { label: "Technical", variant: "primary" },
  business: { label: "Business", variant: "success" },
  extreme: { label: "Extreme Hobby", variant: "danger" },
};

export const categoryLabel = (category) =>
  CATEGORIES[category]?.label ?? category;

export const categoryVariant = (category) =>
  CATEGORIES[category]?.variant ?? "secondary";

// the server hands portfolios back sorted by category then name, so grouping is
// only a matter of splitting the run. empty categories drop out rather than
// leaving a heading with nothing under it
export const groupByCategory = (skills = []) =>
  SKILL_CATEGORIES.map((category) => ({
    category,
    skills: skills.filter((skill) => skill?.category === category),
  })).filter((group) => group.skills.length > 0);

// whoever added a skill may rename or remove it, and so may an admin. the
// seeded catalogue has no creator, which leaves those to the admins
export const canDeleteSkill = (skill, currentUser) =>
  Boolean(currentUser?.isAdmin) ||
  (Boolean(skill?.createdBy) && skill.createdBy === currentUser?._id);
