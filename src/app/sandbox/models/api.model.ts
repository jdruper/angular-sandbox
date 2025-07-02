// API layer interfaces - raw HTTP request/response models

export interface ApiItem {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  price: number;
  created_at: string; // API uses snake_case and strings for dates
  updated_at: string;
}

export interface ApiCreateItemRequest {
  name: string;
  description: string;
  category: string;
  quantity: number;
  price: number;
}

export type ApiUpdateItemRequest = Partial<ApiCreateItemRequest>;

export interface ApiErrorResponse {
  error: string;
  status: number;
}