"""Cost calculator for Anthropic Claude API usage."""

from decimal import Decimal


class CostCalculator:
    """Calculate API costs based on token usage."""

    # Pricing per million tokens (as of 2024)
    # https://www.anthropic.com/pricing
    PRICING = {
        "claude-opus-4-20250514": {
            "input": Decimal("15.00"),
            "output": Decimal("75.00"),
            "cache_write": Decimal("18.75"),  # 1.25x input price
            "cache_read": Decimal("1.50"),    # 0.1x input price
        },
        "claude-sonnet-4-20250514": {
            "input": Decimal("3.00"),
            "output": Decimal("15.00"),
            "cache_write": Decimal("3.75"),   # 1.25x input price
            "cache_read": Decimal("0.30"),    # 0.1x input price
        },
        "claude-3-5-sonnet-20241022": {
            "input": Decimal("3.00"),
            "output": Decimal("15.00"),
            "cache_write": Decimal("3.75"),
            "cache_read": Decimal("0.30"),
        },
        "claude-3-5-haiku-20241022": {
            "input": Decimal("0.80"),
            "output": Decimal("4.00"),
            "cache_write": Decimal("1.00"),
            "cache_read": Decimal("0.08"),
        },
        "claude-3-opus-20240229": {
            "input": Decimal("15.00"),
            "output": Decimal("75.00"),
            "cache_write": Decimal("18.75"),
            "cache_read": Decimal("1.50"),
        },
        "claude-3-sonnet-20240229": {
            "input": Decimal("3.00"),
            "output": Decimal("15.00"),
            "cache_write": Decimal("3.75"),
            "cache_read": Decimal("0.30"),
        },
        "claude-3-haiku-20240307": {
            "input": Decimal("0.25"),
            "output": Decimal("1.25"),
            "cache_write": Decimal("0.30"),
            "cache_read": Decimal("0.03"),
        },
    }

    # Default pricing for unknown models (use Sonnet pricing)
    DEFAULT_PRICING = {
        "input": Decimal("3.00"),
        "output": Decimal("15.00"),
        "cache_write": Decimal("3.75"),
        "cache_read": Decimal("0.30"),
    }

    def get_pricing(self, model: str) -> dict[str, Decimal]:
        """Get pricing for a specific model."""
        return self.PRICING.get(model, self.DEFAULT_PRICING)

    def calculate_cost(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
        cache_creation_tokens: int = 0,
        cache_read_tokens: int = 0,
    ) -> float:
        """
        Calculate the cost of an API call.

        Args:
            model: The model used.
            input_tokens: Number of non-cached input tokens.
            output_tokens: Number of output tokens.
            cache_creation_tokens: Number of tokens used to create cache.
            cache_read_tokens: Number of tokens read from cache.

        Returns:
            Estimated cost in USD.
        """
        pricing = self.get_pricing(model)
        per_million = Decimal("1000000")

        # Input tokens exclude cached tokens in the usage response
        # So we calculate: regular input + cache creation + cache read
        regular_input_tokens = input_tokens - cache_creation_tokens - cache_read_tokens
        if regular_input_tokens < 0:
            regular_input_tokens = 0

        input_cost = (Decimal(regular_input_tokens) / per_million) * pricing["input"]
        output_cost = (Decimal(output_tokens) / per_million) * pricing["output"]
        cache_write_cost = (Decimal(cache_creation_tokens) / per_million) * pricing["cache_write"]
        cache_read_cost = (Decimal(cache_read_tokens) / per_million) * pricing["cache_read"]

        total = input_cost + output_cost + cache_write_cost + cache_read_cost
        return float(total)

    def format_cost(self, cost: float) -> str:
        """Format cost as currency string."""
        if cost < 0.01:
            return f"${cost:.6f}"
        return f"${cost:.4f}"

    def calculate_savings(
        self,
        model: str,
        cache_read_tokens: int,
    ) -> float:
        """
        Calculate savings from cache usage.

        Args:
            model: The model used.
            cache_read_tokens: Number of tokens read from cache.

        Returns:
            Estimated savings in USD compared to uncached request.
        """
        pricing = self.get_pricing(model)
        per_million = Decimal("1000000")

        # Savings = (full input price - cache read price) * cache read tokens
        uncached_cost = (Decimal(cache_read_tokens) / per_million) * pricing["input"]
        cached_cost = (Decimal(cache_read_tokens) / per_million) * pricing["cache_read"]

        return float(uncached_cost - cached_cost)
