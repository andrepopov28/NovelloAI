'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="mb-4 text-muted-foreground">{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
