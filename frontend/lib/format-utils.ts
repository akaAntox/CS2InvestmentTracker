export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("it-IT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatCurrency(value: number, currency = "EUR"): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(value)
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "Unknown error occurred"
}

export function getErrorMessages(errors?: Record<string, string[]>): string[] {
  if (!errors) return []
  return Object.entries(errors).flatMap(([field, messages]) => messages.map((msg) => `${field}: ${msg}`))
}
