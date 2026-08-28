package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

func ConnectPostgres(url string) (*pgxpool.Pool, error) {
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
		CREATE TABLE IF NOT EXISTS products (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name        VARCHAR(255) NOT NULL,
			description TEXT,
			price       NUMERIC(10,2) NOT NULL,
			stock       INTEGER NOT NULL DEFAULT 0,
			category    VARCHAR(100),
			image_url   VARCHAR(500),
			created_at  TIMESTAMPTZ DEFAULT NOW(),
			updated_at  TIMESTAMPTZ DEFAULT NOW()
		)
	`)
	return err
}
