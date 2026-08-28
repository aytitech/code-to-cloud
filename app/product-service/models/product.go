package models

import "time"

// Product is stored in PostgreSQL — structured, transactional data
type Product struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	Stock       int       `json:"stock"`
	Category    string    `json:"category"`
	ImageURL    string    `json:"image_url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ProductDetail is stored in MongoDB — flexible, rich content
type ProductDetail struct {
	ProductID       string         `bson:"product_id" json:"product_id"`
	Specifications  map[string]any `bson:"specifications" json:"specifications"`
	AdditionalImages []string      `bson:"additional_images" json:"additional_images"`
	LongDescription string         `bson:"long_description" json:"long_description"`
}

// ProductFull combines both sources
type ProductFull struct {
	Product
	Detail *ProductDetail `json:"detail,omitempty"`
}
