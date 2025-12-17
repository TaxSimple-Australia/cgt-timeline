"""Anthropic Claude API client with connection pooling, retries, and concurrency control."""

import asyncio
import logging
import time
from dataclasses import dataclass
from decimal import Decimal
from typing import AsyncIterator

import anthropic
from anthropic import APIError, APITimeoutError, RateLimitError

from app.config import Settings, get_settings
from app.models import UsageStats
from app.utils.async_helpers import (
    CircuitBreaker,
    CircuitBreakerOpen,
    ConcurrencyLimiter,
    RequestMetrics,
    with_retry,
)
from app.utils.cost_calculator import CostCalculator

logger = logging.getLogger(__name__)


@dataclass
class ClaudeResponse:
    """Response from Claude API."""

    content: str
    usage: UsageStats
    cached: bool
    model: str
    latency_ms: float


class ClaudeClient:
    """
    High-performance async wrapper for Anthropic Claude API.

    Features:
    - Connection pooling via httpx
    - Semaphore-based concurrency limiting
    - Exponential backoff retry with jitter
    - Circuit breaker pattern for failure protection
    - Request metrics tracking
    - Prompt caching support
    """

    _instance: "ClaudeClient | None" = None
    _lock: asyncio.Lock = asyncio.Lock()

    def __init__(self, settings: Settings | None = None):
        """
        Initialize the Claude client.

        Args:
            settings: Application settings. Uses default settings if not provided.
        """
        self.settings = settings or get_settings()

        if not self.settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")

        # Initialize async Anthropic client with custom httpx settings
        self.client = anthropic.AsyncAnthropic(
            api_key=self.settings.anthropic_api_key,
            max_retries=0,  # We handle retries ourselves
            timeout=anthropic.Timeout(
                connect=10.0,
                read=self.settings.claude_timeout_seconds,
                write=30.0,
                pool=10.0,
            ),
        )

        self.model = self.settings.claude_model
        self.max_tokens = self.settings.claude_max_tokens
        self.cost_calculator = CostCalculator()

        # Concurrency control
        self.concurrency_limiter = ConcurrencyLimiter(
            max_concurrent=self.settings.max_concurrent_claude_calls
        )

        # Circuit breaker for API protection
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            recovery_timeout=30.0,
            half_open_max_calls=3,
        )

        # Metrics tracking
        self.metrics = RequestMetrics()

        logger.info(
            f"ClaudeClient initialized: model={self.model}, "
            f"max_concurrent={self.settings.max_concurrent_claude_calls}"
        )

    @classmethod
    async def get_instance(cls, settings: Settings | None = None) -> "ClaudeClient":
        """
        Get or create singleton instance (thread-safe).

        Args:
            settings: Application settings for first initialization.

        Returns:
            ClaudeClient singleton instance.
        """
        if cls._instance is None:
            async with cls._lock:
                if cls._instance is None:
                    cls._instance = cls(settings)
        return cls._instance

    @classmethod
    async def close_instance(cls) -> None:
        """Close and cleanup the singleton instance."""
        async with cls._lock:
            if cls._instance is not None:
                await cls._instance.close()
                cls._instance = None

    async def close(self) -> None:
        """Close the client and cleanup resources."""
        await self.client.close()
        logger.info(
            f"ClaudeClient closed. Metrics: {self.metrics.to_dict()}"
        )

    async def send_message(
        self,
        user_message: str,
        system_prompt: str,
        max_tokens: int | None = None,
    ) -> ClaudeResponse:
        """
        Send a message to Claude with full concurrency protection.

        Args:
            user_message: The user's message/question.
            system_prompt: The system prompt (will be cached).
            max_tokens: Maximum tokens in response.

        Returns:
            ClaudeResponse with content, usage stats, cache status, and latency.

        Raises:
            CircuitBreakerOpen: If the circuit breaker is open.
            Exception: If all retries fail.
        """
        # Check circuit breaker
        if not await self.circuit_breaker.can_execute():
            raise CircuitBreakerOpen(
                "Claude API circuit breaker is open. Service temporarily unavailable."
            )

        start_time = time.perf_counter()

        try:
            # Acquire concurrency slot
            async with self.concurrency_limiter.acquire(timeout=30.0):
                response = await self._send_with_retry(
                    user_message=user_message,
                    system_prompt=system_prompt,
                    max_tokens=max_tokens or self.max_tokens,
                )

            latency_ms = (time.perf_counter() - start_time) * 1000
            response.latency_ms = latency_ms

            # Record success
            await self.circuit_breaker.record_success()
            await self.metrics.record_request(success=True, latency_ms=latency_ms)

            logger.debug(
                f"Claude request completed in {latency_ms:.0f}ms, "
                f"cached={response.cached}, tokens={response.usage.output_tokens}"
            )

            return response

        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            await self.circuit_breaker.record_failure()
            await self.metrics.record_request(success=False, latency_ms=latency_ms)
            logger.error(f"Claude request failed after {latency_ms:.0f}ms: {e}")
            raise

    @with_retry(
        max_retries=3,
        base_delay=1.0,
        max_delay=30.0,
        retryable_exceptions=(APIError, APITimeoutError, RateLimitError, asyncio.TimeoutError),
    )
    async def _send_with_retry(
        self,
        user_message: str,
        system_prompt: str,
        max_tokens: int,
    ) -> ClaudeResponse:
        """
        Internal method to send message with retry logic.

        This method is decorated with retry logic for transient failures.
        """
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=[
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": user_message,
                }
            ],
        )

        return self._parse_response(response)

    def _parse_response(self, response: anthropic.types.Message) -> ClaudeResponse:
        """Parse the Anthropic API response into our response model."""
        usage = response.usage
        input_tokens = usage.input_tokens
        output_tokens = usage.output_tokens
        cache_creation_tokens = getattr(usage, "cache_creation_input_tokens", 0) or 0
        cache_read_tokens = getattr(usage, "cache_read_input_tokens", 0) or 0

        estimated_cost = self.cost_calculator.calculate_cost(
            model=self.model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cache_creation_tokens=cache_creation_tokens,
            cache_read_tokens=cache_read_tokens,
        )

        cached = cache_read_tokens > 0

        content = ""
        for block in response.content:
            if block.type == "text":
                content += block.text

        return ClaudeResponse(
            content=content,
            usage=UsageStats(
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cache_creation_input_tokens=cache_creation_tokens,
                cache_read_input_tokens=cache_read_tokens,
                estimated_cost_usd=Decimal(str(round(estimated_cost, 6))),
            ),
            cached=cached,
            model=self.model,
            latency_ms=0.0,  # Will be set by caller
        )

    async def send_message_streaming(
        self,
        user_message: str,
        system_prompt: str,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        """
        Send a message to Claude with streaming response.

        Args:
            user_message: The user's message/question.
            system_prompt: The system prompt (will be cached).
            max_tokens: Maximum tokens in response.

        Yields:
            Text chunks as they arrive.
        """
        # Check circuit breaker
        if not await self.circuit_breaker.can_execute():
            raise CircuitBreakerOpen(
                "Claude API circuit breaker is open. Service temporarily unavailable."
            )

        start_time = time.perf_counter()

        try:
            async with self.concurrency_limiter.acquire(timeout=30.0):
                async with self.client.messages.stream(
                    model=self.model,
                    max_tokens=max_tokens or self.max_tokens,
                    system=[
                        {
                            "type": "text",
                            "text": system_prompt,
                            "cache_control": {"type": "ephemeral"},
                        }
                    ],
                    messages=[
                        {
                            "role": "user",
                            "content": user_message,
                        }
                    ],
                ) as stream:
                    async for text in stream.text_stream:
                        yield text

            latency_ms = (time.perf_counter() - start_time) * 1000
            await self.circuit_breaker.record_success()
            await self.metrics.record_request(success=True, latency_ms=latency_ms)

        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            await self.circuit_breaker.record_failure()
            await self.metrics.record_request(success=False, latency_ms=latency_ms)
            logger.error(f"Claude streaming request failed: {e}")
            raise

    def get_metrics(self) -> dict:
        """Get current client metrics."""
        return {
            **self.metrics.to_dict(),
            "circuit_breaker_state": self.circuit_breaker.state.value,
            "active_requests": self.concurrency_limiter.active_count,
            "available_slots": self.concurrency_limiter.available_slots,
            "total_processed": self.concurrency_limiter.total_processed,
        }
