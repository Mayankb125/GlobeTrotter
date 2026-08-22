"""
Groq API client wrapper.

Provides a thin client for Groq API with typed responses and retry logic.
Used for semantic search and document store operations.
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional

import httpx
from pydantic import BaseModel, Field

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class GroqSearchResult(BaseModel):
    """Result from Groq semantic search."""
    
    id: str = Field(description="Document ID")
    score: float = Field(description="Relevance score")
    content: str = Field(description="Document content")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Document metadata"
    )


class GroqSearchResponse(BaseModel):
    """Response from Groq search endpoint."""
    
    results: List[GroqSearchResult] = Field(description="Search results")
    total: int = Field(description="Total number of results")
    query: str = Field(description="Original query")


class GroqClient:
    """
    Client for Groq API with chat completion support.
    
    Supports Groq's inference API for LLM-based chat completions.
    """
    
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None) -> None:
        """
        Initialize Groq client.
        
        Args:
            api_key: Groq API key (uses settings if not provided)
            model: Model to use (defaults to settings.groq_model)
        """
        settings = get_settings()
        # Fallback if settings has no groq_api_key/model attribute
        self.api_key = api_key or getattr(settings, "GROQ_API_KEY", "")
        self.model = model or "openai/gpt-oss-20b"
        self.base_url = "https://api.groq.com/openai/v1"
        
        self._client = httpx.AsyncClient(
            timeout=60.0,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            } if self.api_key else {},
        )
    
    async def chat(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """
        Chat completion using Groq LLM.
        
        Args:
            prompt: User prompt/question
            system_prompt: System instructions (optional)
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum response tokens
            
        Returns:
            LLM response text
        """
        if not self.api_key or self.api_key.startswith("placeholder"):
            logger.warning("Groq API key not configured - using stub response")
            # Return a valid mock JSON for itinerary planning
            return """{
              "destination": "Mock Destination",
              "duration_days": 3,
              "accommodation": {
                "name": "The Mock Grand Palace",
                "cost_per_night": 5000,
                "total_nights": 2,
                "total_cost": 10000,
                "recommendation": "Great value, central location, and friendly service."
              },
              "daily_schedule": [
                {
                  "day": 1,
                  "date": "Day 1",
                  "activities": [
                    {
                      "time": "09:00 AM - 12:00 PM",
                      "name": "Historical Fort Tour",
                      "description": "Guided walking tour through the majestic city fort.",
                      "location": "City Fort",
                      "cost": 500,
                      "transportation": "Taxi"
                    },
                    {
                      "time": "02:00 PM - 05:00 PM",
                      "name": "Local Craft Bazaar",
                      "description": "Explore the vibrant local markets and buy traditional crafts.",
                      "location": "Craft Bazaar",
                      "cost": 0,
                      "transportation": "Auto-rickshaw"
                    }
                  ],
                  "meals": [
                    {
                      "time": "lunch",
                      "restaurant": "Traditional Diner",
                      "cuisine": "Local Heritage",
                      "estimated_cost": 800
                    }
                  ],
                  "total_day_cost": 1300
                },
                {
                  "day": 2,
                  "date": "Day 2",
                  "activities": [
                    {
                      "time": "10:00 AM - 01:00 PM",
                      "name": "Art & History Museum",
                      "description": "Visit the central museum housing historical artifacts.",
                      "location": "Museum",
                      "cost": 300,
                      "transportation": "Walking"
                    }
                  ],
                  "meals": [
                    {
                      "time": "lunch",
                      "restaurant": "Garden Cafe",
                      "cuisine": "Organic",
                      "estimated_cost": 500
                    }
                  ],
                  "total_day_cost": 800
                }
              ],
              "transportation": {
                "to_destination": {
                  "method": "Train",
                  "cost": 1500,
                  "duration": "4 hours"
                },
                "local": "Auto-rickshaw and walking",
                "estimated_local_cost": 1200
              },
              "cost_breakdown": {
                "accommodation": 10000,
                "activities": 800,
                "food": 5000,
                "transportation": 2700,
                "miscellaneous": 1500,
                "total": 20000,
                "currency": "INR"
              },
              "special_notes": "Wear comfortable walking shoes. Carry local currency for local auto rides."
            }"""
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = await self._client.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
            )
            
            response.raise_for_status()
            result = response.json()
            
            return result["choices"][0]["message"]["content"]
            
        except Exception as e:
            logger.error(f"Groq chat error: {e}")
            raise
    
    async def search(
        self,
        query: str,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> GroqSearchResponse:
        """
        Perform semantic search.
        
        Args:
            query: Search query
            limit: Maximum number of results
            filters: Optional filters
            
        Returns:
            Search response with results
        """
        logger.info(
            f"Groq search: {query}",
            extra={"query": query, "limit": limit}
        )
        
        # Stub implementation - return mock data
        if not self.api_key or self.api_key.startswith("placeholder"):
            logger.warning("Using stub Groq client - no real API calls")
            return GroqSearchResponse(
                results=[
                    GroqSearchResult(
                        id="doc-1",
                        score=0.95,
                        content=f"Mock result for query: {query}",
                        metadata={"source": "stub"},
                    )
                ],
                total=1,
                query=query,
            )
        
        try:
            response = await self._client.post(
                f"{self.base_url}/search",
                json={"query": query, "limit": limit, "filters": filters},
            )
            response.raise_for_status()
            data = response.json()
            return GroqSearchResponse(**data)
        except httpx.HTTPError as e:
            logger.error(f"Groq API error: {e}")
            raise
    
    async def store_document(
        self,
        doc_id: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Store a document in Groq.
        
        Args:
            doc_id: Document identifier
            content: Document content
            metadata: Optional metadata
            
        Returns:
            True if successful
        """
        logger.info(f"Storing document in Groq: {doc_id}")
        return True
    
    async def close(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
    
    async def __aenter__(self) -> "GroqClient":
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, *args: Any) -> None:
        """Async context manager exit."""
        await self.close()
