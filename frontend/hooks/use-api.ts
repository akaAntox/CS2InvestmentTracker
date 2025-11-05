import useSWR, { type SWRConfiguration } from "swr"
import { ApiError } from "@/lib/api-client"

export function useApi<T>(key: string | null, fetcher: (() => Promise<T>) | null, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(key && fetcher ? key : null, fetcher, {
    revalidateOnFocus: false,
    ...options,
  })

  return {
    data: data as T | undefined,
    isLoading,
    error: error as ApiError | undefined,
    mutate,
  }
}

export async function handleApiMutation(
  promise: Promise<unknown>,
  onSuccess?: () => void,
  onError?: (error: ApiError) => void,
) {
  try {
    await promise
    onSuccess?.()
  } catch (error) {
    if (error instanceof ApiError) {
      onError?.(error)
    }
  }
}
