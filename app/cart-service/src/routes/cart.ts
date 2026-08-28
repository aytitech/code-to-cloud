import { Router, Response } from "express";
import redis from "../redis";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

function cartKey(userId: string): string {
  return `cart:${userId}`;
}

async function getCart(userId: string): Promise<CartItem[]> {
  const data = await redis.get(cartKey(userId));
  return data ? JSON.parse(data) : [];
}

async function saveCart(userId: string, items: CartItem[]): Promise<void> {
  // Cart expires after 7 days of inactivity
  await redis.set(cartKey(userId), JSON.stringify(items), "EX", 60 * 60 * 24 * 7);
}

router.use(authMiddleware);

// GET /api/cart
router.get("/", async (req: AuthRequest, res: Response) => {
  const items = await getCart(req.userId!);
  res.json({ items, total: items.reduce((sum, i) => sum + i.price * i.quantity, 0) });
});

// POST /api/cart/items — add or update item
router.post("/items", async (req: AuthRequest, res: Response) => {
  const item: CartItem = req.body;
  if (!item.productId || !item.price || !item.quantity) {
    res.status(400).json({ error: "productId, price and quantity are required" });
    return;
  }

  const items = await getCart(req.userId!);
  const existing = items.find((i) => i.productId === item.productId);

  if (existing) {
    existing.quantity += item.quantity;
  } else {
    items.push(item);
  }

  await saveCart(req.userId!, items);
  res.status(201).json({ items });
});

// PUT /api/cart/items/:productId — set quantity
router.put("/items/:productId", async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const { quantity } = req.body as { quantity: number };

  if (quantity < 1) {
    res.status(400).json({ error: "quantity must be at least 1" });
    return;
  }

  const items = await getCart(req.userId!);
  const item = items.find((i) => i.productId === productId);

  if (!item) {
    res.status(404).json({ error: "item not in cart" });
    return;
  }

  item.quantity = quantity;
  await saveCart(req.userId!, items);
  res.json({ items });
});

// DELETE /api/cart/items/:productId — remove one item
router.delete("/items/:productId", async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  let items = await getCart(req.userId!);
  items = items.filter((i) => i.productId !== productId);
  await saveCart(req.userId!, items);
  res.json({ items });
});

// DELETE /api/cart — clear cart
router.delete("/", async (req: AuthRequest, res: Response) => {
  await redis.del(cartKey(req.userId!));
  res.json({ items: [] });
});

export default router;
