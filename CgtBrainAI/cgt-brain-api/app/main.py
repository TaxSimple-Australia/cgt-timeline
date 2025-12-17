"""FastAPI application for CGT Brain API with high-concurrency support."""

import asyncio
import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import Annotated, AsyncGenerator

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.claude_client import ClaudeClient
from app.config import Settings, get_settings
from app.models import AnalyzeRequest, AnalyzeResponse, HealthResponse
from app.prompts import SYSTEM_PROMPT
from app.utils.async_helpers import CircuitBreakerOpen, ConcurrencyLimiter
from app.routers import portfolio

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global concurrency limiter for total API requests
request_limiter: ConcurrencyLimiter | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.

    Handles startup and shutdown of shared resources.
    """
    global request_limiter

    settings = get_settings()

    # Initialize global request limiter
    request_limiter = ConcurrencyLimiter(
        max_concurrent=settings.max_concurrent_requests
    )

    # Initialize Claude client singleton
    await ClaudeClient.get_instance(settings)

    logger.info(
        f"CGT Brain API started: "
        f"max_requests={settings.max_concurrent_requests}, "
        f"max_claude_calls={settings.max_concurrent_claude_calls}"
    )

    yield

    # Cleanup on shutdown
    await ClaudeClient.close_instance()
    logger.info("CGT Brain API shutdown complete")


app = FastAPI(
    title="CGT Brain API",
    description="Australian Capital Gains Tax Calculator powered by Claude AI",
    version="1.0.0",
    lifespan=lifespan,
)

# Include portfolio analysis router
app.include_router(portfolio.router)


# ============================================================================
# Middleware
# ============================================================================


@app.middleware("http")
async def request_middleware(request: Request, call_next):
    """
    Middleware for request tracking, timing, and concurrency control.

    - Assigns unique request ID
    - Tracks request timing
    - Enforces global concurrency limits
    - Handles request timeouts
    """
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    start_time = time.perf_counter()

    # Add request ID to logs
    logger.info(f"[{request_id}] {request.method} {request.url.path} started")

    try:
        # Enforce global concurrency limit
        if request_limiter is not None and request.url.path.startswith("/api/"):
            try:
                async with request_limiter.acquire(timeout=10.0):
                    response = await call_next(request)
            except asyncio.TimeoutError:
                logger.warning(
                    f"[{request_id}] Request rejected: concurrency limit reached"
                )
                return JSONResponse(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    content={
                        "detail": "Server is at capacity. Please retry shortly.",
                        "request_id": request_id,
                    },
                )
        else:
            response = await call_next(request)

        # Add timing and request ID headers
        duration_ms = (time.perf_counter() - start_time) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-Ms"] = f"{duration_ms:.0f}"

        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"completed in {duration_ms:.0f}ms - {response.status_code}"
        )

        return response

    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.error(
            f"[{request_id}] {request.method} {request.url.path} "
            f"failed after {duration_ms:.0f}ms: {e}"
        )
        raise


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Response-Time-Ms"],
)


# ============================================================================
# Dependencies
# ============================================================================


async def get_claude_client() -> ClaudeClient:
    """Dependency to get the Claude client singleton."""
    return await ClaudeClient.get_instance()


async def get_app_settings() -> Settings:
    """Dependency to get application settings."""
    return get_settings()


# Type aliases for dependency injection
ClaudeClientDep = Annotated[ClaudeClient, Depends(get_claude_client)]
SettingsDep = Annotated[Settings, Depends(get_app_settings)]


# ============================================================================
# Exception Handlers
# ============================================================================


@app.exception_handler(CircuitBreakerOpen)
async def circuit_breaker_exception_handler(
    request: Request, exc: CircuitBreakerOpen
) -> JSONResponse:
    """Handle circuit breaker open exceptions."""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.warning(f"[{request_id}] Circuit breaker open: {exc}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": "AI service temporarily unavailable. Please retry in 30 seconds.",
            "request_id": request_id,
            "retry_after": 30,
        },
        headers={"Retry-After": "30"},
    )


@app.exception_handler(asyncio.TimeoutError)
async def timeout_exception_handler(
    request: Request, exc: asyncio.TimeoutError
) -> JSONResponse:
    """Handle timeout exceptions."""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"[{request_id}] Request timeout: {exc}")
    return JSONResponse(
        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
        content={
            "detail": "Request timed out. Please try again.",
            "request_id": request_id,
        },
    )


# ============================================================================
# Endpoints
# ============================================================================


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """
    Health check endpoint.

    Returns basic service status information.
    """
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        service="cgt-brain-api",
    )


@app.get("/health/detailed", tags=["Health"])
async def detailed_health_check(claude_client: ClaudeClientDep) -> dict:
    """
    Detailed health check with metrics.

    Returns service status including Claude client metrics and concurrency info.
    """
    metrics = claude_client.get_metrics()

    request_limiter_info = {}
    if request_limiter is not None:
        request_limiter_info = {
            "active_requests": request_limiter.active_count,
            "available_slots": request_limiter.available_slots,
            "total_processed": request_limiter.total_processed,
        }

    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "cgt-brain-api",
        "claude_client": metrics,
        "request_limiter": request_limiter_info,
    }


@app.post("/api/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze_property(
    request: Request,
    body: AnalyzeRequest,
    claude_client: ClaudeClientDep,
    settings: SettingsDep,
) -> AnalyzeResponse:
    """
    Analyze property timeline data for CGT calculations.

    Accepts property timeline JSON data and returns step-by-step
    CGT calculations based on ITAA97 rules.

    This endpoint is protected by:
    - Global request concurrency limiting
    - Claude API concurrency limiting
    - Circuit breaker for API protection
    - Automatic retries with exponential backoff
    """
    request_id = getattr(request.state, "request_id", "unknown")

    try:
        user_message = f"""Please analyze the following property timeline data and calculate the Capital Gains Tax implications:

```json
{body.property_data.model_dump_json(indent=2)}
```

{f"Additional context: {body.additional_context}" if body.additional_context else ""}

Please provide:
1. A summary of the property ownership timeline
2. Main residence exemption eligibility analysis
3. Step-by-step CGT calculation
4. Any relevant ITAA97 sections that apply
5. The final CGT outcome"""

        # Send to Claude with timeout
        response = await asyncio.wait_for(
            claude_client.send_message(
                user_message=user_message,
                system_prompt=SYSTEM_PROMPT,
            ),
            timeout=settings.request_timeout_seconds,
        )

        logger.info(
            f"[{request_id}] Analysis completed: "
            f"tokens={response.usage.input_tokens}+{response.usage.output_tokens}, "
            f"cached={response.cached}, latency={response.latency_ms:.0f}ms"
        )

        return AnalyzeResponse(
            analysis=response.content,
            usage=response.usage,
            cached=response.cached,
            model=response.model,
        )

    except asyncio.TimeoutError:
        logger.error(f"[{request_id}] Analysis request timed out")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Analysis request timed out. Please try again.",
        )
    except CircuitBreakerOpen:
        # Let the exception handler deal with this
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Error analyzing property: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing request: {str(e)}",
        )


# ============================================================================
# Main Entry Point
# ============================================================================


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level="info",
    )
