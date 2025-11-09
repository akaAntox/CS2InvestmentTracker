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

interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}

async function parseError(response: Response): Promise<{ message?: string; errors?: Record<string, string[]> }> {
  const contentType = response.headers.get("content-type") || ""

  // Prova a leggere il body in modo sicuro
  let raw: unknown = undefined
  try {
    if (contentType.includes("application/json") || contentType.includes("application/problem+json")) {
      raw = await response.json()
    } else {
      const text = await response.text()
      // Se il testo è vuoto, lascia undefined
      raw = text || undefined
    }
  } catch {
    // body non parsabile: lascia undefined
  }

  // Caso: nessun body
  if (raw === undefined) {
    return { message: `HTTP ${response.status}` }
  }

  // Caso: JSON string (es. "Error from external API")
  if (typeof raw === "string") {
    return { message: raw }
  }

  // Caso: oggetto
  const obj = raw as Record<string, any>

  // RFC 7807
  if ("title" in obj || "detail" in obj || "status" in obj) {
    const pd = obj as ProblemDetails
    return {
      message: pd.detail || pd.title || `HTTP ${response.status}`,
      errors: pd.errors
    }
  }

  // Schema custom { message, errors }
  if ("message" in obj || "errors" in obj) {
    return {
      message: (obj.message as string) || `HTTP ${response.status}`,
      errors: obj.errors as Record<string, string[]>
    }
  }

  // Fallback finale
  return { message: `HTTP ${response.status}` }
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`
  const { method = "GET", body } = options

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json, application/problem+json, text/plain;q=0.5"
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
  }

  if (body !== undefined) {
    config.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const { message, errors } = await parseError(response)
      throw new ApiError(response.status, errors, message)
    }

    if (response.status === 204) {
      return undefined as T
    }

    // Se il server risponde 200 ma senza body JSON (es. text/plain)
    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      // Prova comunque a leggere il testo per debug, o ritorna undefined
      return (await response.text()) as unknown as T
    }

    return await response.json()
  } catch (err) {
    if (err instanceof ApiError) {
      throw err
    }
    const e = err as Error
    throw new ApiError(0, undefined, e?.message || "Network error")
  }
}

// Items API
export const itemsApi = {
  getAll: () => apiRequest<any[]>("/items"),
  getById: (id: string) => apiRequest<any>(`/items/${id}`),
  create: (data: any) => apiRequest<any>("/items", { method: "POST", body: data }),
  update: (id: string, data: any) => apiRequest<any>(`/items`, { method: "PUT", body: data }),
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
