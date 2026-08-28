package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"search-service/elastic"
)

type Handler struct {
	es *elastic.Client
}

func New(es *elastic.Client) *Handler {
	return &Handler{es: es}
}

func (h *Handler) Search(c *gin.Context) {
	q := c.Query("q")
	category := c.Query("category")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	result, err := h.es.Search(c.Request.Context(), q, category, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed"})
		return
	}

	c.JSON(http.StatusOK, result)
}
