export function getOfferStatus(deal, now = Date.now()) {
  if (deal?.isActive === false) return "Inactive";
  if (deal?.endDate && new Date(deal.endDate).getTime() <= now) return "Expired";
  if (deal?.startDate && new Date(deal.startDate).getTime() > now) return "Upcoming";
  return "Active";
}
// Capture a request-time instant before sending it to the client clock.
export async function getOfferTime() { return Date.now(); }
export function toDateInput(value) {
  return value ? new Date(value).toISOString().slice(0, -1) : "";
}
export function fromDateInput(value) {
  return value ? new Date(`${value}Z`).toISOString() : null;
}
export function dateValidation(start, end) {
  return start && end && new Date(`${end}Z`) <= new Date(`${start}Z`)
    ? "Offer end date must be after the start date." : "";
}
export function remainingTime(date, now) {
  const minutes = Math.max(0, Math.ceil((new Date(date).getTime() - now) / 60000));
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
  return `${Math.floor(minutes / 1440)} days ${Math.floor((minutes % 1440) / 60)} hr`;
}
