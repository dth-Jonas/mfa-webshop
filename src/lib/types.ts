export interface ProductVariant {
  id: string;
  name?: string;
  size?: string;
  color?: string;
  price?: number;
  stock?: number;
  inventory?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  status?: string;
  isActive?: boolean;
  stock?: number;
  inventory?: number;
  imageUrl?: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  variants?: ProductVariant[];
}

export interface OrderItem {
  id?: string;
  productId?: string;
  productName?: string;
  name?: string;
  variantId?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  createdAt: any;
  totalAmount?: number;
  totalPrice?: number;
  status: string;
  paymentStatus?: string;
  paid?: boolean;
  note?: string;
  items: OrderItem[];
}

export interface SupplierSummaryItem {
  id?: string;
  productName?: string;
  name?: string;
  size?: string;
  color?: string;
  quantity: number;
  price?: number;
}

export interface OrderWindow {
  id: string;
  title?: string;
  startDate: any;
  endDate: any;
  isActive?: boolean;
}
