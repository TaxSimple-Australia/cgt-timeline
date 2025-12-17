"""Async helper utilities for concurrency management."""

import asyncio
import logging
import random
import time
from collections.abc import Awaitable, Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from enum import Enum
from functools import wraps
from typing import Any, ParamSpec, TypeVar

logger = logging.getLogger(__name__)

P = ParamSpec("P")
T = TypeVar("T")


class CircuitState(Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class CircuitBreaker:
    """
    Circuit breaker pattern implementation for protecting against cascading failures.

    When failures exceed the threshold, the circuit opens and rejects requests
    immediately. After a timeout, it enters half-open state to test recovery.
    """

    failure_threshold: int = 5
    recovery_timeout: float = 30.0
    half_open_max_calls: int = 3

    _state: CircuitState = field(default=CircuitState.CLOSED, init=False)
    _failure_count: int = field(default=0, init=False)
    _last_failure_time: float = field(default=0.0, init=False)
    _half_open_calls: int = field(default=0, init=False)
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock, init=False)

    @property
    def state(self) -> CircuitState:
        """Get current circuit state."""
        return self._state

    async def _check_state(self) -> None:
        """Check and potentially transition circuit state."""
        async with self._lock:
            if self._state == CircuitState.OPEN:
                if time.time() - self._last_failure_time >= self.recovery_timeout:
                    logger.info("Circuit breaker transitioning to HALF_OPEN")
                    self._state = CircuitState.HALF_OPEN
                    self._half_open_calls = 0

    async def record_success(self) -> None:
        """Record a successful call."""
        async with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._half_open_calls += 1
                if self._half_open_calls >= self.half_open_max_calls:
                    logger.info("Circuit breaker transitioning to CLOSED")
                    self._state = CircuitState.CLOSED
                    self._failure_count = 0
            elif self._state == CircuitState.CLOSED:
                self._failure_count = 0

    async def record_failure(self) -> None:
        """Record a failed call."""
        async with self._lock:
            self._failure_count += 1
            self._last_failure_time = time.time()

            if self._state == CircuitState.HALF_OPEN:
                logger.warning("Circuit breaker transitioning to OPEN (half-open failure)")
                self._state = CircuitState.OPEN
            elif self._failure_count >= self.failure_threshold:
                logger.warning(
                    f"Circuit breaker transitioning to OPEN "
                    f"(failures: {self._failure_count}/{self.failure_threshold})"
                )
                self._state = CircuitState.OPEN

    async def can_execute(self) -> bool:
        """Check if a call can be executed."""
        await self._check_state()
        return self._state != CircuitState.OPEN


class CircuitBreakerOpen(Exception):
    """Raised when circuit breaker is open."""

    pass


@dataclass
class ConcurrencyLimiter:
    """
    Manages concurrent request limits using semaphores.

    Provides both global request limiting and per-resource limiting.
    """

    max_concurrent: int
    _semaphore: asyncio.Semaphore = field(init=False)
    _active_count: int = field(default=0, init=False)
    _total_processed: int = field(default=0, init=False)
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock, init=False)

    def __post_init__(self) -> None:
        self._semaphore = asyncio.Semaphore(self.max_concurrent)

    @property
    def active_count(self) -> int:
        """Number of currently active requests."""
        return self._active_count

    @property
    def total_processed(self) -> int:
        """Total number of processed requests."""
        return self._total_processed

    @property
    def available_slots(self) -> int:
        """Number of available slots."""
        return self.max_concurrent - self._active_count

    @asynccontextmanager
    async def acquire(self, timeout: float | None = None):
        """
        Acquire a slot with optional timeout.

        Args:
            timeout: Maximum time to wait for a slot (None = wait forever)

        Raises:
            asyncio.TimeoutError: If timeout is reached
        """
        if timeout is not None:
            try:
                await asyncio.wait_for(self._semaphore.acquire(), timeout=timeout)
            except asyncio.TimeoutError:
                logger.warning(
                    f"Concurrency limit timeout after {timeout}s "
                    f"(active: {self._active_count}/{self.max_concurrent})"
                )
                raise
        else:
            await self._semaphore.acquire()

        async with self._lock:
            self._active_count += 1

        try:
            yield
        finally:
            async with self._lock:
                self._active_count -= 1
                self._total_processed += 1
            self._semaphore.release()


def with_retry(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retryable_exceptions: tuple[type[Exception], ...] = (Exception,),
) -> Callable[[Callable[P, Awaitable[T]]], Callable[P, Awaitable[T]]]:
    """
    Decorator for async functions with exponential backoff retry.

    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay between retries in seconds
        max_delay: Maximum delay between retries
        exponential_base: Base for exponential backoff
        jitter: Add random jitter to prevent thundering herd
        retryable_exceptions: Tuple of exceptions that trigger retry
    """

    def decorator(func: Callable[P, Awaitable[T]]) -> Callable[P, Awaitable[T]]:
        @wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            last_exception: Exception | None = None

            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e

                    if attempt == max_retries:
                        logger.error(
                            f"{func.__name__} failed after {max_retries + 1} attempts: {e}"
                        )
                        raise

                    # Calculate delay with exponential backoff
                    delay = min(base_delay * (exponential_base**attempt), max_delay)

                    # Add jitter (±25%)
                    if jitter:
                        delay *= 0.75 + random.random() * 0.5

                    logger.warning(
                        f"{func.__name__} attempt {attempt + 1}/{max_retries + 1} "
                        f"failed: {e}. Retrying in {delay:.2f}s"
                    )

                    await asyncio.sleep(delay)

            # Should never reach here, but satisfy type checker
            raise last_exception  # type: ignore

        return wrapper

    return decorator


async def run_with_timeout(
    coro: Awaitable[T],
    timeout: float,
    timeout_message: str = "Operation timed out",
) -> T:
    """
    Run a coroutine with a timeout.

    Args:
        coro: The coroutine to run
        timeout: Timeout in seconds
        timeout_message: Message for the timeout error

    Returns:
        The result of the coroutine

    Raises:
        asyncio.TimeoutError: If the operation times out
    """
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except asyncio.TimeoutError:
        logger.error(f"{timeout_message} (timeout: {timeout}s)")
        raise


@dataclass
class RequestMetrics:
    """Track request metrics for monitoring."""

    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_latency_ms: float = 0.0
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock, init=False)

    @property
    def average_latency_ms(self) -> float:
        """Calculate average latency."""
        if self.successful_requests == 0:
            return 0.0
        return self.total_latency_ms / self.successful_requests

    @property
    def success_rate(self) -> float:
        """Calculate success rate."""
        if self.total_requests == 0:
            return 1.0
        return self.successful_requests / self.total_requests

    async def record_request(self, success: bool, latency_ms: float) -> None:
        """Record a request result."""
        async with self._lock:
            self.total_requests += 1
            if success:
                self.successful_requests += 1
                self.total_latency_ms += latency_ms
            else:
                self.failed_requests += 1

    def to_dict(self) -> dict[str, Any]:
        """Convert metrics to dictionary."""
        return {
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "average_latency_ms": round(self.average_latency_ms, 2),
            "success_rate": round(self.success_rate, 4),
        }
