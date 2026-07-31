"use client";

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ErrorPage({
  error,
  reset,
}: ErrorPageProps) {
  return (
    <main>
      <h1>Errore</h1>

      <p>
        Non è stato possibile caricare i concerti.
      </p>

      {process.env.NODE_ENV === "development" && (
        <pre>{error.message}</pre>
      )}

      <button type="button" onClick={reset}>
        Riprova
      </button>
    </main>
  );
}