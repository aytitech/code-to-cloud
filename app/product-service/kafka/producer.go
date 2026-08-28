package kafka

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	kafkago "github.com/segmentio/kafka-go"
)

type Producer struct {
	writer *kafkago.Writer
}

func NewProducer(brokers string) *Producer {
	return &Producer{
		writer: &kafkago.Writer{
			Addr:         kafkago.TCP(strings.Split(brokers, ",")...),
			Balancer:     &kafkago.LeastBytes{},
			WriteTimeout: 5 * time.Second,
		},
	}
}

func (p *Producer) Publish(ctx context.Context, topic string, payload any) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	return p.writer.WriteMessages(ctx, kafkago.Message{
		Topic: topic,
		Value: data,
	})
}

func (p *Producer) Close() {
	p.writer.Close()
}
