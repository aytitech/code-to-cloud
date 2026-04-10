package kafkaconsumer

import (
	"context"
	"encoding/json"
	"log"
	"strings"

	kafkago "github.com/segmentio/kafka-go"

	"search-service/elastic"
)

func Start(ctx context.Context, brokers string, esClient *elastic.Client) {
	topics := []string{"product.created", "product.updated"}

	for _, topic := range topics {
		go consume(ctx, brokers, topic, esClient)
	}
}

func consume(ctx context.Context, brokers, topic string, esClient *elastic.Client) {
	r := kafkago.NewReader(kafkago.ReaderConfig{
		Brokers: strings.Split(brokers, ","),
		Topic:   topic,
		GroupID: "search-service",
	})
	defer r.Close()

	log.Printf("search-service: consuming %s", topic)

	for {
		msg, err := r.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			log.Printf("kafka read error on %s: %v", topic, err)
			continue
		}

		var product map[string]any
		if err := json.Unmarshal(msg.Value, &product); err != nil {
			log.Printf("failed to decode product event: %v", err)
			continue
		}

		if err := esClient.IndexProduct(ctx, product); err != nil {
			log.Printf("failed to index product %v: %v", product["id"], err)
		} else {
			log.Printf("indexed product %v from topic %s", product["id"], topic)
		}
	}
}
