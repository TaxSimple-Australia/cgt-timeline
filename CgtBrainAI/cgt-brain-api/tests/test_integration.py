"""Integration tests for CGT Brain API."""

import asyncio
import os
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import UsageStats
from app.utils import CostCalculator, ConcurrencyLimiter, CircuitBreaker, RequestMetrics
from tests.test_data import (
    SIMPLE_MAIN_RESIDENCE,
    PARTIAL_MAIN_RESIDENCE,
    INVESTMENT_PROPERTY,
    ALL_TEST_SCENARIOS,
)


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_claude_response():
    """Create a mock Claude response."""
    return MagicMock(
        content="Mock CGT analysis response",
        usage=UsageStats(
            input_tokens=1000,
            output_tokens=500,
            cache_creation_input_tokens=800,
            cache_read_input_tokens=0,
            estimated_cost_usd=Decimal("0.01"),
        ),
        cached=False,
        model="claude-sonnet-4-20250514",
        latency_ms=1500.0,
    )


class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    def test_health_check_returns_200(self, client):
        """Test health check returns 200 OK."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_check_response_structure(self, client):
        """Test health check response has correct structure."""
        response = client.get("/health")
        data = response.json()

        assert "status" in data
        assert "version" in data
        assert "service" in data
        assert data["status"] == "healthy"
        assert data["service"] == "cgt-brain-api"

    def test_health_check_has_request_id_header(self, client):
        """Test health check response includes request ID header."""
        response = client.get("/health")
        assert "x-request-id" in response.headers


class TestAnalyzeEndpoint:
    """Tests for the analyze endpoint."""

    @patch("app.main.ClaudeClient.get_instance")
    def test_analyze_endpoint_accepts_valid_request(self, mock_get_instance, client, mock_claude_response):
        """Test analyze endpoint accepts valid property data."""
        mock_client = AsyncMock()
        mock_client.send_message = AsyncMock(return_value=mock_claude_response)
        mock_get_instance.return_value = mock_client

        response = client.post(
            "/api/analyze",
            json={
                "property_data": SIMPLE_MAIN_RESIDENCE.model_dump(mode="json"),
            },
        )

        assert response.status_code == 200

    def test_analyze_endpoint_rejects_invalid_request(self, client):
        """Test analyze endpoint rejects invalid data."""
        response = client.post(
            "/api/analyze",
            json={"invalid": "data"},
        )

        assert response.status_code == 422

    def test_analyze_endpoint_requires_property_data(self, client):
        """Test analyze endpoint requires property_data field."""
        response = client.post(
            "/api/analyze",
            json={},
        )

        assert response.status_code == 422


class TestPropertyTimelineValidation:
    """Tests for PropertyTimeline model validation."""

    def test_valid_simple_main_residence(self):
        """Test simple main residence data is valid."""
        data = SIMPLE_MAIN_RESIDENCE
        assert data.property_address is not None
        assert data.acquisition_date is not None
        assert data.acquisition_cost > 0

    def test_valid_partial_main_residence(self):
        """Test partial main residence data is valid."""
        data = PARTIAL_MAIN_RESIDENCE
        assert len(data.events) > 0
        assert data.disposal_proceeds > data.acquisition_cost

    def test_valid_investment_property(self):
        """Test investment property data is valid."""
        data = INVESTMENT_PROPERTY
        assert data.cost_base_additions is not None
        assert data.ownership_percentage == Decimal("100")

    def test_all_scenarios_valid(self):
        """Test all test scenarios are valid PropertyTimeline objects."""
        for name, scenario in ALL_TEST_SCENARIOS.items():
            assert scenario.property_address, f"{name} missing address"
            assert scenario.acquisition_date, f"{name} missing acquisition date"
            assert scenario.owner_name, f"{name} missing owner name"


class TestCostCalculator:
    """Tests for the cost calculator utility."""

    @pytest.fixture
    def calculator(self):
        """Create cost calculator instance."""
        return CostCalculator()

    def test_calculate_cost_with_cache_creation(self, calculator):
        """Test cost calculation with cache creation."""
        cost = calculator.calculate_cost(
            model="claude-sonnet-4-20250514",
            input_tokens=1000,
            output_tokens=500,
            cache_creation_tokens=800,
            cache_read_tokens=0,
        )

        assert cost > 0
        assert isinstance(cost, float)

    def test_calculate_cost_with_cache_read(self, calculator):
        """Test cost calculation with cache read."""
        cost = calculator.calculate_cost(
            model="claude-sonnet-4-20250514",
            input_tokens=1000,
            output_tokens=500,
            cache_creation_tokens=0,
            cache_read_tokens=800,
        )

        assert cost > 0

    def test_cache_read_cheaper_than_creation(self, calculator):
        """Test that cache read is cheaper than cache creation."""
        cost_with_creation = calculator.calculate_cost(
            model="claude-sonnet-4-20250514",
            input_tokens=1000,
            output_tokens=500,
            cache_creation_tokens=800,
            cache_read_tokens=0,
        )

        cost_with_read = calculator.calculate_cost(
            model="claude-sonnet-4-20250514",
            input_tokens=1000,
            output_tokens=500,
            cache_creation_tokens=0,
            cache_read_tokens=800,
        )

        assert cost_with_read < cost_with_creation

    def test_calculate_savings(self, calculator):
        """Test savings calculation."""
        savings = calculator.calculate_savings(
            model="claude-sonnet-4-20250514",
            cache_read_tokens=1000,
        )

        assert savings > 0

    def test_format_cost_small_amount(self, calculator):
        """Test formatting small cost amounts."""
        formatted = calculator.format_cost(0.001234)
        assert formatted.startswith("$")
        assert "0.001234" in formatted

    def test_format_cost_larger_amount(self, calculator):
        """Test formatting larger cost amounts."""
        formatted = calculator.format_cost(0.05)
        assert formatted.startswith("$")
        assert "0.05" in formatted

    def test_unknown_model_uses_default_pricing(self, calculator):
        """Test that unknown models use default pricing."""
        pricing = calculator.get_pricing("unknown-model-xyz")
        assert pricing == calculator.DEFAULT_PRICING

    def test_known_model_uses_specific_pricing(self, calculator):
        """Test that known models use specific pricing."""
        # Use Opus which has different pricing than default (Sonnet)
        pricing = calculator.get_pricing("claude-opus-4-20250514")
        assert pricing != calculator.DEFAULT_PRICING
        assert pricing["input"] == Decimal("15.00")


class TestConcurrencyLimiter:
    """Tests for the concurrency limiter."""

    @pytest.fixture
    def limiter(self):
        """Create a concurrency limiter."""
        return ConcurrencyLimiter(max_concurrent=3)

    @pytest.mark.asyncio
    async def test_limiter_allows_within_limit(self, limiter):
        """Test that requests within limit are allowed."""
        async with limiter.acquire():
            assert limiter.active_count == 1
            assert limiter.available_slots == 2

    @pytest.mark.asyncio
    async def test_limiter_blocks_over_limit(self, limiter):
        """Test that requests over limit are blocked until slot available."""
        acquired = []

        async def acquire_slot(slot_id):
            async with limiter.acquire():
                acquired.append(slot_id)
                await asyncio.sleep(0.1)

        # Start 4 tasks but only 3 slots available
        tasks = [asyncio.create_task(acquire_slot(i)) for i in range(4)]
        await asyncio.sleep(0.05)

        # Only 3 should have acquired immediately
        assert limiter.active_count == 3

        # Wait for all to complete
        await asyncio.gather(*tasks)
        assert len(acquired) == 4

    @pytest.mark.asyncio
    async def test_limiter_timeout(self, limiter):
        """Test that timeout works when limit reached."""
        # Fill all slots
        async with limiter.acquire():
            async with limiter.acquire():
                async with limiter.acquire():
                    # Try to acquire with very short timeout
                    with pytest.raises(asyncio.TimeoutError):
                        async with limiter.acquire(timeout=0.01):
                            pass


class TestCircuitBreaker:
    """Tests for the circuit breaker."""

    @pytest.fixture
    def breaker(self):
        """Create a circuit breaker with low threshold for testing."""
        return CircuitBreaker(
            failure_threshold=2,
            recovery_timeout=0.1,
            half_open_max_calls=1,
        )

    @pytest.mark.asyncio
    async def test_circuit_starts_closed(self, breaker):
        """Test that circuit starts in closed state."""
        from app.utils.async_helpers import CircuitState
        assert breaker.state == CircuitState.CLOSED

    @pytest.mark.asyncio
    async def test_circuit_opens_after_failures(self, breaker):
        """Test that circuit opens after threshold failures."""
        from app.utils.async_helpers import CircuitState

        await breaker.record_failure()
        assert breaker.state == CircuitState.CLOSED

        await breaker.record_failure()
        assert breaker.state == CircuitState.OPEN

    @pytest.mark.asyncio
    async def test_circuit_rejects_when_open(self, breaker):
        """Test that circuit rejects requests when open."""
        # Open the circuit
        await breaker.record_failure()
        await breaker.record_failure()

        assert not await breaker.can_execute()

    @pytest.mark.asyncio
    async def test_circuit_half_opens_after_timeout(self, breaker):
        """Test that circuit enters half-open state after recovery timeout."""
        from app.utils.async_helpers import CircuitState

        # Open the circuit
        await breaker.record_failure()
        await breaker.record_failure()

        # Wait for recovery timeout
        await asyncio.sleep(0.15)

        # Should be able to execute (half-open)
        assert await breaker.can_execute()
        assert breaker.state == CircuitState.HALF_OPEN


class TestRequestMetrics:
    """Tests for request metrics tracking."""

    @pytest.fixture
    def metrics(self):
        """Create a request metrics instance."""
        return RequestMetrics()

    @pytest.mark.asyncio
    async def test_metrics_track_successful_requests(self, metrics):
        """Test that successful requests are tracked."""
        await metrics.record_request(success=True, latency_ms=100.0)
        await metrics.record_request(success=True, latency_ms=200.0)

        assert metrics.total_requests == 2
        assert metrics.successful_requests == 2
        assert metrics.failed_requests == 0
        assert metrics.average_latency_ms == 150.0

    @pytest.mark.asyncio
    async def test_metrics_track_failed_requests(self, metrics):
        """Test that failed requests are tracked."""
        await metrics.record_request(success=True, latency_ms=100.0)
        await metrics.record_request(success=False, latency_ms=50.0)

        assert metrics.total_requests == 2
        assert metrics.successful_requests == 1
        assert metrics.failed_requests == 1
        assert metrics.success_rate == 0.5

    @pytest.mark.asyncio
    async def test_metrics_to_dict(self, metrics):
        """Test metrics conversion to dictionary."""
        await metrics.record_request(success=True, latency_ms=100.0)

        result = metrics.to_dict()
        assert "total_requests" in result
        assert "success_rate" in result
        assert "average_latency_ms" in result


class TestCORSConfiguration:
    """Tests for CORS configuration."""

    def test_cors_allows_production_origin(self, client):
        """Test CORS allows production origin."""
        response = client.options(
            "/health",
            headers={
                "Origin": "https://cgtbrain.com.au",
                "Access-Control-Request-Method": "GET",
            },
        )

        assert response.headers.get("access-control-allow-origin") == "https://cgtbrain.com.au"

    def test_cors_allows_localhost(self, client):
        """Test CORS allows localhost for development."""
        response = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )

        assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


@pytest.mark.integration
class TestLiveIntegration:
    """Live integration tests (require API key)."""

    @pytest.fixture
    def has_api_key(self):
        """Check if API key is available."""
        return bool(os.getenv("ANTHROPIC_API_KEY"))

    @pytest.mark.skipif(
        not os.getenv("ANTHROPIC_API_KEY"),
        reason="ANTHROPIC_API_KEY not set",
    )
    def test_live_analyze_request(self, client):
        """Test live analysis request (requires API key)."""
        response = client.post(
            "/api/analyze",
            json={
                "property_data": SIMPLE_MAIN_RESIDENCE.model_dump(mode="json"),
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        assert "usage" in data
        assert len(data["analysis"]) > 0
