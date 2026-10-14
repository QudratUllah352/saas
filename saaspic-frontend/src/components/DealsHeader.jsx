export default function DealsHeader({
  title,
  description,
  count,
}) {
  return (
    <section className="deals-hero">
      <div className="deals-container">

        <p className="deals-label">
          SAAS DEALS
        </p>

        <h1>{title}</h1>

        <p>
          {description}
        </p>

        <div className="deals-count">
          {count} deals available
        </div>

      </div>
    </section>
  );
}

