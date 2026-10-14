"use client";

export default function Error({
  error,
  reset,
}) {
  return (
    <div className="site-state-page">

      <div className="site-state-icon">
        !
      </div>

      <h1>Something Went Wrong</h1>

      <p>
        SaaSpin could not load this page.
        Please try again.
      </p>

      {process.env.NODE_ENV ===
        "development" &&
        error?.message && (
          <p className="site-error-message">
            {error.message}
          </p>
        )}

      <button
        type="button"
        className="site-state-primary"
        onClick={() => reset()}
      >
        Try Again
      </button>

    </div>
  );
}