'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    // console.error('[App Error Boundary]', error);
  }, [error])

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-lg border bg-background p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred while rendering this page.
        </p>
        <pre className="mt-4 max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
          {error?.message || 'Unknown error'}
        </pre>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus:outline-none"
            onClick={() => reset()}
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
