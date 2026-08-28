export interface OrderCreatedEvent {
  order_id: string;
  user_id: string;
  total: number;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
  }>;
}
