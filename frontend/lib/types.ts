// Item types
export interface Item {
  id: string
  name: string
  description?: string
  categoryId: string
  price: number
  currentMarketPrice?: number
  insertDate: string
  editDate?: string
}

export interface ItemCreate {
  name: string
  description?: string
  categoryId: string
  price: number
}

export interface ItemUpdate extends ItemCreate {}

// Category types
export interface Category {
  id: string
  name: string
  description?: string
  insertDate: string
  editDate?: string
}

export interface CategoryCreate {
  name: string
  description?: string
}

export interface CategoryUpdate extends CategoryCreate {}

// Steam market price types
export interface SteamMarketPrice {
  id: string
  itemId: string
  price: number
  currency: string
  trackDate: string
}

export interface SteamPriceUpdate {
  price: number
  currency?: string
}

// Event log types
export interface EventLog {
  id: string
  itemId?: string
  categoryId?: string
  action: "CREATE" | "UPDATE" | "DELETE" | "PRICE_UPDATE"
  description: string
  oldValue?: string
  newValue?: string
  insertDate: string
}

// API Response types
export interface ApiErrorResponse {
  errors?: Record<string, string[]>
  message?: string
  statusCode?: number
}

export interface KpiData {
  totalItems: number
  totalCategories: number
  averagePrice: number
  itemsUpdatedToday: number
}
