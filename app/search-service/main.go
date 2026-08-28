package main

import (
	"context"
	"log"

	"github.com/gin-gonic/gin"

	"search-service/config"
	"search-service/elastic"
	"search-service/handlers"
	kafkaconsumer "search-service/kafkaconsumer"
)

func cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, OPTIONS")
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

	esClient, err := elastic.New(cfg.ElasticsearchURL)
	if err != nil {
		log.Fatalf("failed to create elasticsearch client: %v", err)
	}

	ctx := context.Background()
	if err := esClient.EnsureIndex(ctx); err != nil {
		log.Printf("warning: could not ensure elasticsearch index: %v", err)
	}

	kafkaconsumer.Start(ctx, cfg.KafkaBrokers, esClient)

	h := handlers.New(esClient)

	r := gin.Default()
	r.Use(cors())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "search-service"})
	})

	r.GET("/api/search", h.Search)

	log.Printf("search-service listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
