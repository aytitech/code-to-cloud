package config

import "os"

type Config struct {
	Port         string
	DatabaseURL  string
	MongoURL     string
	MongoDB      string
	KafkaBrokers string
	JWTSecret    string
}

func Load() *Config {
	return &Config{
		Port:         getEnv("PORT", "8002"),
		DatabaseURL:  getEnv("DB_URL", "postgres://postgres:postgres@localhost:5432/products?sslmode=disable"),
		MongoURL:     getEnv("MONGO_URL", "mongodb://localhost:27017"),
		MongoDB:      getEnv("MONGO_DB", "stackshop"),
		KafkaBrokers: getEnv("KAFKA_BROKERS", "localhost:9092"),
		JWTSecret:    getEnv("JWT_SECRET", "changeme-dev-secret"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
