import { plural } from "./plural";

// the server pins a role to a month rather than a day, as "YYYY-MM": nobody
// remembers the date they joined a board, and as strings these sort and compare
// with < . the same pattern the model validates against, so the form can turn a
// bad month away before it costs a round trip
// [0-9] rather than \d so the one spelling serves both the test below and the
// form control's pattern attribute, which takes its source as plain text
export const MONTH_PATTERN = "[0-9]{4}-(0[1-9]|1[0-2])";

const isMonth = (value) => new RegExp(`^${MONTH_PATTERN}$`).test(value);

// a month with no day is a date the Date constructor reads as UTC midnight,
// which in a timezone behind UTC is the last day of the month before. naming
// the day keeps "2019-03" from rendering as February
const monthDate = (month) => new Date(`${month}-01T00:00:00`);

// this month, in the form the server wants: the furthest ahead a role can
// reasonably begin or end, which is what the form's max attribute is for
export const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// "2019-03" reads as "March 2019" on the page. anything that isn't a month is
// handed back untouched rather than rendered as "Invalid Date"
export const formatMonth = (month) =>
  isMonth(month)
    ? monthDate(month).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : month;

// an absent end is the point of the field: it is how a role says "still there",
// and null, undefined and "" all mean the same thing here
export const isCurrentRole = (role) => !role?.end;

// "March 2019 – Present". the dash is an en dash, which is what a span of time
// takes rather than the hyphen inside the month itself
export const rolePeriod = (role) =>
  `${formatMonth(role.start)} – ${
    isCurrentRole(role) ? "Present" : formatMonth(role.end)
  }`;

// whole months between the two ends, counting the month it began as served: a
// role that starts and ends in the same month reads as one month rather than
// none. a current role is measured to this month
const monthsHeld = (role) => {
  if (!isMonth(role?.start)) {
    return 0;
  }
  const start = monthDate(role.start);
  const end = monthDate(isCurrentRole(role) ? currentMonth() : role.end);

  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1
  );
};

// how long they have held it, the way a work history says it: "6 yrs 7 mos".
// a whole number of years drops the months rather than saying "0 mos"
export const roleDuration = (role) => {
  const months = monthsHeld(role);
  if (months <= 0) {
    return null;
  }

  const years = Math.floor(months / 12);
  const remainder = months % 12;

  return [
    years > 0 ? plural(years, "yr") : null,
    remainder > 0 ? plural(remainder, "mo") : null,
  ]
    .filter(Boolean)
    .join(" ");
};
