package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"product-service/config"
	"product-service/db"
	"product-service/handlers"
	"product-service/kafka"
)

func cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func main() {
	cfg := config.Load()

	pg, err := db.ConnectPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to postgres: %v", err)
	}
	defer pg.Close()

	if err := db.Migrate(pg); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	mongoDB, err := db.ConnectMongo(cfg.MongoURL, cfg.MongoDB)
	if err != nil {
		log.Fatalf("failed to connect to mongodb: %v", err)
	}

	producer := kafka.NewProducer(cfg.KafkaBrokers)
	defer producer.Close()

	h := handlers.New(pg, mongoDB, producer, cfg)

	r := gin.Default()
	r.Use(cors())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "product-service"})
	})

	api := r.Group("/api/products")
	{
		api.GET("", h.ListProducts)
		api.GET("/:id", h.GetProduct)
		api.POST("", h.AuthMiddleware(), h.CreateProduct)
		api.PUT("/:id", h.AuthMiddleware(), h.UpdateProduct)
		api.DELETE("/:id", h.AuthMiddleware(), h.DeleteProduct)
	}

	log.Printf("product-service listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
