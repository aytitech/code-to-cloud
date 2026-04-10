import express from "express";
import cartRouter from "./routes/cart";

const app = express();
const PORT = process.env.PORT ?? 8004;

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "cart-service" });
});

app.use("/api/cart", cartRouter);

app.listen(PORT, () => {
  console.log(`cart-service listening on :${PORT}`);
});
