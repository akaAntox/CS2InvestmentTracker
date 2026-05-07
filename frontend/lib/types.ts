// Item types
export interface Item {
  id: string
  name: string
  description?: string
  categoryId: string
  buyPrice: number
  minSellPrice?: number
  insertDate: string
  editDate?: string
}

export interface ItemCreate {
  name: string
  description?: string
  categoryId: string
  buyPrice: number
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

export interface CategorySummary {
  id: number
  name: string
  description: string
  itemCount: number
  totalQuantity: number
  totalBuyPrice: number
  totalMinSellPrice: number | null
  totalNetProfit: number | null
  averagePercentProfit: number | null
  bestItem: string | null
  worstItem: string | null
}

// Steam market buyPrice types
export interface SteamMarketPrice {
  id: string
  itemId: string
  buyPrice: number
  currency: string
  trackDate: string
}

export interface SteamPriceUpdate {
  buyPrice: number
  currency?: string
}

// Event log types
// ActionType enum from backend: Insert=0, Update=1, Delete=2
export enum ActionType {
  Insert = 0,
  Update = 1,
  Delete = 2,
}

export interface EventLog {
  id: number
  date: string
  action: ActionType
  message: string
  oldValues?: string | null
  newValues?: string | null
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
