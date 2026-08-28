package config

import "os"

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8001"),
		DatabaseURL: getEnv("DB_URL", "postgres://postgres:postgres@localhost:5432/users?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "changeme-dev-secret"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
