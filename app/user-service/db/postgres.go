package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(url string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(context.Background(), url)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(context.Background()); err != nil {
		return nil, err
	}
	return pool, nil
}

func Migrate(pool *pgxpool.Pool) error {
	_, err := pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS users (
			id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email        VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			name         VARCHAR(255) NOT NULL,
			created_at   TIMESTAMPTZ DEFAULT NOW()
		)
	`)
	return err
}
