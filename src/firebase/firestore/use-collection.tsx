'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string }

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null // Document data with ID, or null.
  isLoading: boolean // True if loading.
  error: FirestoreError | Error | null // Error object, or null.
  retry: () => void // Function to retry the operation
  isRetrying: boolean // Flag to indicate if retry is in progress
}

/**
 * Types of Firestore errors
 */
type FirestoreErrorType =
  | 'permission'
  | 'network'
  | 'resource-exhausted'
  | 'unavailable'
  | 'unauthenticated'
  | 'unknown'

/**
 * Interface for path extraction result
 */
interface PathExtractionResult {
  path: string
  isValid: boolean
}

/**
 * Extracts the collection path from a Firestore reference or query
 * @param targetRefOrQuery - The Firestore reference or query
 * @returns Object containing the path and validation status
 */
function extractCollectionPath(
  targetRefOrQuery: CollectionReference<DocumentData> | Query<DocumentData>
): PathExtractionResult {
  try {
    // Check if it's a CollectionReference (has 'path' property directly)
    if (
      'path' in targetRefOrQuery &&
      typeof targetRefOrQuery.path === 'string'
    ) {
      return {
        path: targetRefOrQuery.path,
        isValid: true,
      }
    }

    // For Query references, extract path from internal _query structure
    if ('_query' in targetRefOrQuery) {
      const internal = targetRefOrQuery as InternalQuery
      const path = internal._query?.path?.canonicalString?.()
      return {
        path,
        isValid: Boolean(path),
      }
    }

    // Fallback for other cases
    return {
      path: 'unknown',
      isValid: false,
    }
  } catch (error) {
    console.warn('Failed to extract collection path:', error)
    return {
      path: 'unknown',
      isValid: false,
    }
  }
}

/**
 * Categorizes Firestore errors into specific types
 * @param error - The Firestore error
 * @returns The categorized error type
 */
function categorizeFirestoreError(error: FirestoreError): FirestoreErrorType {
  const code = error.code

  switch (code) {
    case 'permission-denied':
      return 'permission'
    case 'unavailable':
    case 'deadline-exceeded':
      return 'unavailable'
    case 'resource-exhausted':
      return 'resource-exhausted'
    case 'failed-precondition':
    case 'aborted':
      return 'network'
    case 'unauthenticated':
      return 'unauthenticated'
    default:
      return 'unknown'
  }
}

/**
 * Determines if an error is retryable based on its type
 * @param errorType - The categorized error type
 * @returns True if the error is retryable
 */
function isRetryableError(errorType: FirestoreErrorType): boolean {
  return ['network', 'unavailable', 'resource-exhausted'].includes(errorType)
}

/**
 * Creates an enhanced error with proper categorization and metadata
 * @param error - Original Firestore error
 * @param operation - Operation that failed
 * @param targetRefOrQuery - The query/reference that failed
 * @returns Enhanced error with additional context
 */
function createEnhancedError(
  error: FirestoreError,
  operation: string,
  targetRefOrQuery: CollectionReference<DocumentData> | Query<DocumentData>
): Error {
  try {
    const errorType = categorizeFirestoreError(error)
    const { path } = extractCollectionPath(targetRefOrQuery)

    // Create a new error that preserves the original Firestore error information
    const enhancedError = new Error(
      `Firestore ${errorType} error on ${operation}: ${error.message} (path: ${path || 'unknown'})`
    ) as Error & {
      originalError: FirestoreError
      errorType: FirestoreErrorType
      isRetryable: boolean
      timestamp: number
      operation: string
      path: string
      code: string
    }

    // Add enhanced metadata
    enhancedError.originalError = error
    enhancedError.errorType = errorType
    enhancedError.isRetryable = isRetryableError(errorType)
    enhancedError.timestamp = Date.now()
    enhancedError.operation = operation
    enhancedError.path = path || 'unknown'
    enhancedError.code = error.code

    return enhancedError
  } catch (creationError) {
    console.warn(
      'Failed to create enhanced error, falling back to original error:',
      creationError
    )
    // Return the original error if enhancement fails
    return error
  }
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string
      toString(): string
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries with enhanced error handling.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error, retry function.
 */
export function useCollection<T = DocumentData>(
  memoizedTargetRefOrQuery:
    | ((CollectionReference<DocumentData> | Query<DocumentData>) & {
        __memo?: boolean
      })
    | null
    | undefined
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>
  type StateDataType = ResultItemType[] | null

  // State management with proper typing
  const [data, setData] = useState<StateDataType>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<FirestoreError | Error | null>(null)
  const [isRetrying, setIsRetrying] = useState<boolean>(false)

  // Memoize derived values for performance
  const _hasValidQuery = useMemo(
    () => Boolean(memoizedTargetRefOrQuery),
    [memoizedTargetRefOrQuery]
  )

  // Memoize the success handler to prevent unnecessary re-creations
  const handleSuccess = useCallback((snapshot: QuerySnapshot<DocumentData>) => {
    try {
      // Optimize array creation with pre-allocated size
      const docCount = snapshot.docs.length
      const results: ResultItemType[] = new Array(docCount)

      // Use for loop for better performance than forEach
      for (let i = 0; i < docCount; i++) {
        const doc = snapshot.docs[i]
        results[i] = { ...(doc.data() as T), id: doc.id }
      }

      setData(results)
      setError(null)
      setIsLoading(false)
      setIsRetrying(false)
    } catch (processingError) {
      console.error('Error processing snapshot:', processingError)
      setError(processingError as Error)
      setIsLoading(false)
      setIsRetrying(false)
    }
  }, [])

  // Memoize the error handler
  const handleError = useCallback(
    (error: FirestoreError) => {
      try {
        let contextualError: FirestorePermissionError | Error

        try {
          contextualError = createEnhancedError(
            error,
            'list',
            memoizedTargetRefOrQuery!
          )
        } catch (enhancedCreationError) {
          console.warn(
            'Failed to create enhanced error, using original error:',
            enhancedCreationError
          )
          contextualError = error
        }

        setError(contextualError)
        setData(null)
        setIsLoading(false)

        // Only emit permission errors globally
        try {
          const errorType = categorizeFirestoreError(error)
          if (errorType === 'permission') {
            // Try to create a FirestorePermissionError for the emitter
            let permissionError: FirestorePermissionError
            try {
              const { path } = extractCollectionPath(memoizedTargetRefOrQuery!)
              permissionError = new FirestorePermissionError({
                operation: 'list',
                path: path || 'unknown-collection',
              })
              errorEmitter.emit('permission-error', permissionError)
            } catch (permissionErrorCreationError) {
              console.warn(
                'Failed to create FirestorePermissionError for emitter:',
                permissionErrorCreationError
              )
              // Skip emission if we can't create the proper error type
            }
          }
        } catch (emitterError) {
          console.warn('Error emitting permission error:', emitterError)
        }

        // Log errors for debugging
        console.warn('Firestore error:', {
          code: error.code,
          message: error.message,
          operation: 'list',
        })
      } catch (handlerError) {
        console.error('Critical error in error handler:', handlerError)
        // Fallback to setting the original error
        setError(error)
        setData(null)
        setIsLoading(false)
      }
    },
    [memoizedTargetRefOrQuery]
  )

  // Memoized retry function
  const retry = useCallback(() => {
    if (
      error &&
      typeof (error as { isRetryable?: boolean }).isRetryable === 'boolean' &&
      (error as { isRetryable?: boolean }).isRetryable
    ) {
      setIsRetrying(true)
      setIsLoading(true)
      setError(null)
    }
  }, [error])

  // Main effect with improved dependency management
  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      queueMicrotask(() => {
        setData(null)
        setIsLoading(false)
        setError(null)
        setIsRetrying(false)
      })
      return
    }

    queueMicrotask(() => {
      setIsLoading(true)
      setError(null)
    })

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      handleSuccess,
      handleError
    )

    return () => {
      unsubscribe()
    }
  }, [memoizedTargetRefOrQuery, handleSuccess, handleError])

  // Memoization validation with better error message
  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(
      `Query/reference was not properly memoized using useMemoFirebase. ` +
        `Expected __memo property but got: ${typeof memoizedTargetRefOrQuery}`
    )
  }

  return { data, isLoading, error, retry, isRetrying }
}
