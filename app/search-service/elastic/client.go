package elastic

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"

	elasticsearch "github.com/elastic/go-elasticsearch/v8"
)

const indexName = "products"

type Client struct {
	es *elasticsearch.Client
}

func New(url string) (*Client, error) {
	es, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{url},
	})
	if err != nil {
		return nil, err
	}
	return &Client{es: es}, nil
}

func (c *Client) EnsureIndex(ctx context.Context) error {
	res, err := c.es.Indices.Exists([]string{indexName}, c.es.Indices.Exists.WithContext(ctx))
	if err != nil {
		return err
	}
	res.Body.Close()
	if res.StatusCode == 200 {
		return nil
	}

	mapping := `{
		"mappings": {
			"properties": {
				"id":       { "type": "keyword" },
				"name":     { "type": "text" },
				"description": { "type": "text" },
				"category": { "type": "keyword" },
				"price":    { "type": "float" },
				"stock":    { "type": "integer" }
			}
		}
	}`
	res, err = c.es.Indices.Create(indexName,
		c.es.Indices.Create.WithContext(ctx),
		c.es.Indices.Create.WithBody(strings.NewReader(mapping)),
	)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.IsError() {
		body, _ := io.ReadAll(res.Body)
		return fmt.Errorf("failed to create index: %s", string(body))
	}
	return nil
}

func (c *Client) IndexProduct(ctx context.Context, product map[string]any) error {
	id, _ := product["id"].(string)
	data, err := json.Marshal(product)
	if err != nil {
		return err
	}

	res, err := c.es.Index(indexName,
		bytes.NewReader(data),
		c.es.Index.WithDocumentID(id),
		c.es.Index.WithContext(ctx),
		c.es.Index.WithRefresh("true"),
	)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.IsError() {
		body, _ := io.ReadAll(res.Body)
		return fmt.Errorf("index error: %s", string(body))
	}
	return nil
}

type SearchResult struct {
	Products []map[string]any `json:"products"`
	Total    int              `json:"total"`
}

func (c *Client) Search(ctx context.Context, query string, category string, limit int) (*SearchResult, error) {
	must := []map[string]any{}
	filter := []map[string]any{}

	if query != "" {
		must = append(must, map[string]any{
			"multi_match": map[string]any{
				"query":  query,
				"fields": []string{"name^2", "description"},
			},
		})
	}

	if category != "" {
		filter = append(filter, map[string]any{
			"term": map[string]any{"category": category},
		})
	}

	esQuery := map[string]any{
		"size": limit,
		"query": map[string]any{
			"bool": map[string]any{
				"must":   must,
				"filter": filter,
			},
		},
	}

	if len(must) == 0 {
		esQuery["query"] = map[string]any{"match_all": map[string]any{}}
	}

	data, _ := json.Marshal(esQuery)
	res, err := c.es.Search(
		c.es.Search.WithContext(ctx),
		c.es.Search.WithIndex(indexName),
		c.es.Search.WithBody(bytes.NewReader(data)),
	)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.IsError() {
		body, _ := io.ReadAll(res.Body)
		return nil, fmt.Errorf("search error: %s", string(body))
	}

	var raw struct {
		Hits struct {
			Total struct {
				Value int `json:"value"`
			} `json:"total"`
			Hits []struct {
				Source map[string]any `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}

	if err := json.NewDecoder(res.Body).Decode(&raw); err != nil {
		return nil, err
	}

	products := make([]map[string]any, 0, len(raw.Hits.Hits))
	for _, hit := range raw.Hits.Hits {
		products = append(products, hit.Source)
	}

	return &SearchResult{Products: products, Total: raw.Hits.Total.Value}, nil
}
