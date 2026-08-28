package handlers

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

	"product-service/config"
	"product-service/kafka"
	"product-service/models"
)

type Handler struct {
	pg       *pgxpool.Pool
	mongo    *mongo.Database
	producer *kafka.Producer
	cfg      *config.Config
}

func New(pg *pgxpool.Pool, mongoDB *mongo.Database, producer *kafka.Producer, cfg *config.Config) *Handler {
	return &Handler{pg: pg, mongo: mongoDB, producer: producer, cfg: cfg}
}

// AuthMiddleware validates JWT and sets user_id in context
func (h *Handler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if len(header) < 8 || header[:7] != "Bearer " {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid token"})
			return
		}
		tokenStr := header[7:]
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(h.cfg.JWTSecret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		claims := token.Claims.(jwt.MapClaims)
		c.Set("user_id", claims["sub"])
		c.Next()
	}
}

type createProductRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Price       float64 `json:"price" binding:"required,gt=0"`
	Stock       int     `json:"stock" binding:"gte=0"`
	Category    string  `json:"category"`
	ImageURL    string  `json:"image_url"`
}

func (h *Handler) ListProducts(c *gin.Context) {
	category := c.Query("category")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var rows interface{ Scan(...any) error }
	var err error

	query := `SELECT id, name, description, price, stock, category, image_url, created_at, updated_at FROM products`
	args := []any{}

	if category != "" {
		query += ` WHERE category = $1`
		args = append(args, category)
		query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`
		args = append(args, limit, offset)
	} else {
		query += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`
		args = append(args, limit, offset)
	}

	pgRows, err := h.pg.Query(context.Background(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch products"})
		return
	}
	defer pgRows.Close()
	_ = rows

	products := []models.Product{}
	for pgRows.Next() {
		var p models.Product
		if err := pgRows.Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.Stock, &p.Category, &p.ImageURL, &p.CreatedAt, &p.UpdatedAt); err != nil {
			continue
		}
		products = append(products, p)
	}

	c.JSON(http.StatusOK, products)
}

func (h *Handler) GetProduct(c *gin.Context) {
	id := c.Param("id")

	var p models.ProductFull
	err := h.pg.QueryRow(context.Background(),
		`SELECT id, name, description, price, stock, category, image_url, created_at, updated_at FROM products WHERE id = $1`,
		id,
	).Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.Stock, &p.Category, &p.ImageURL, &p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	// Enrich with MongoDB detail
	var detail models.ProductDetail
	err = h.mongo.Collection("product_details").FindOne(context.Background(),
		bson.M{"product_id": id},
	).Decode(&detail)
	if err == nil {
		p.Detail = &detail
	}

	c.JSON(http.StatusOK, p)
}

func (h *Handler) CreateProduct(c *gin.Context) {
	var req createProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var p models.Product
	err := h.pg.QueryRow(context.Background(),
		`INSERT INTO products (name, description, price, stock, category, image_url)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, name, description, price, stock, category, image_url, created_at, updated_at`,
		req.Name, req.Description, req.Price, req.Stock, req.Category, req.ImageURL,
	).Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.Stock, &p.Category, &p.ImageURL, &p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create product"})
		return
	}

	// Publish event for search indexing
	_ = h.producer.Publish(context.Background(), "product.created", p)

	c.JSON(http.StatusCreated, p)
}

func (h *Handler) UpdateProduct(c *gin.Context) {
	id := c.Param("id")

	var req createProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var p models.Product
	err := h.pg.QueryRow(context.Background(),
		`UPDATE products SET name=$1, description=$2, price=$3, stock=$4, category=$5, image_url=$6, updated_at=NOW()
		 WHERE id=$7
		 RETURNING id, name, description, price, stock, category, image_url, created_at, updated_at`,
		req.Name, req.Description, req.Price, req.Stock, req.Category, req.ImageURL, id,
	).Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.Stock, &p.Category, &p.ImageURL, &p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	// Publish event for search re-indexing
	_ = h.producer.Publish(context.Background(), "product.updated", p)

	c.JSON(http.StatusOK, p)
}

func (h *Handler) DeleteProduct(c *gin.Context) {
	id := c.Param("id")

	result, err := h.pg.Exec(context.Background(),
		`DELETE FROM products WHERE id = $1`, id,
	)
	if err != nil || result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "product deleted"})
}
