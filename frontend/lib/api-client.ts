const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: unknown
}

interface ApiErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public errors?: Record<string, string[]>,
    message?: string,
  ) {
    super(message || `API Error: ${status}`)
    this.name = "ApiError"
  }
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`
  const { method = "GET", body } = options

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      let errorData: ApiErrorResponse = {}
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: `HTTP ${response.status}` }
      }

      throw new ApiError(response.status, errorData.errors, errorData.message)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(0, undefined, "Network error")
  }
}

// Items API
export const itemsApi = {
  getAll: () => apiRequest<any[]>("/items"),
  getById: (id: string) => apiRequest<any>(`/items/${id}`),
  create: (data: any) => apiRequest<any>("/items", { method: "POST", body: data }),
  update: (id: string, data: any) => apiRequest<any>(`/items/${id}`, { method: "PUT", body: data }),
  delete: (id: string) => apiRequest<void>(`/items/${id}`, { method: "DELETE" }),
}

// Categories API
export const categoriesApi = {
  getAll: () => apiRequest<any[]>("/categories"),
  getById: (id: string) => apiRequest<any>(`/categories/${id}`),
  create: (data: any) => apiRequest<any>("/categories", { method: "POST", body: data }),
  update: (id: string, data: any) => apiRequest<any>(`/categories/${id}`, { method: "PUT", body: data }),
  delete: (id: string) => apiRequest<void>(`/categories/${id}`, { method: "DELETE" }),
}

// Steam API
export const steamApi = {
  updateAll: () => apiRequest<void>("/steam", { method: "POST" }),
  updateById: (id: string) => apiRequest<void>(`/steam/${id}`, { method: "POST" }),
}
