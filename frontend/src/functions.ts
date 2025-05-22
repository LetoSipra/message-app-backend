export function formatTimestamp(timestamp: number, locale = "en-US") {
  const date = new Date(timestamp);
  const now = new Date();

  const isSameDay = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  const isThisWeek =
    now.getTime() - date.getTime() < msInWeek &&
    date.getDay() !== now.getDay() &&
    !isSameDay &&
    !isYesterday;

  if (isSameDay) {
    // e.g. "11:05 AM"
    return new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }

  if (isYesterday) {
    return "Yesterday";
  }

  if (isThisWeek) {
    // e.g. "Monday"
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
    }).format(date);
  }

  // e.g. "12 March 2024"
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
