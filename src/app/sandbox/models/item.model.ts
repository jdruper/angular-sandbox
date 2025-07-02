export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemRequest {
  name: string;
  description: string;
  category: string;
  quantity: number;
  price: number;
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {
  id: string;
}