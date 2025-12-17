"""Pydantic models for CGT Brain API."""

from .schemas import (
    EventType,
    PropertyTimeline,
    PropertyEvent,
    AnalyzeRequest,
    AnalyzeResponse,
    UsageStats,
    HealthResponse,
)

from .portfolio_schemas import (
    PropertyHistoryEvent,
    TimelineProperty,
    AdditionalInfo,
    PortfolioAnalyzeRequest,
    PortfolioAnalyzeResponse,
)

__all__ = [
    # Legacy schemas
    "EventType",
    "PropertyTimeline",
    "PropertyEvent",
    "AnalyzeRequest",
    "AnalyzeResponse",
    "UsageStats",
    "HealthResponse",
    # Portfolio/Frontend schemas
    "PropertyHistoryEvent",
    "TimelineProperty",
    "AdditionalInfo",
    "PortfolioAnalyzeRequest",
    "PortfolioAnalyzeResponse",
]
