import "./offer-dates.css";
export default function OfferDatesFields({ startDate, endDate, onChange, prefix = "offer" }) {
  return (
    <fieldset className="offer-date-fields">
      <legend>Offer schedule (optional)</legend>
      <p>All times are UTC. Leave the end date blank for no expiry.</p>
      <div className="offer-date-grid">
        <div><label htmlFor={`${prefix}-start`}>Start date and time (UTC)</label><input id={`${prefix}-start`} type="datetime-local" step="0.001" name="startDate" value={startDate} onChange={onChange} /></div>
        <div><label htmlFor={`${prefix}-end`}>End date and time (UTC)</label><input id={`${prefix}-end`} type="datetime-local" step="0.001" name="endDate" value={endDate} onChange={onChange} /></div>
      </div>
    </fieldset>
  );
}
