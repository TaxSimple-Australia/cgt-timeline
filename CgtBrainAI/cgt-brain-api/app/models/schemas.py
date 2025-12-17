"""Pydantic models for CGT Brain API."""

from datetime import date
from decimal import Decimal
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class EventType(str, Enum):
    """Types of property events."""

    PURCHASE = "purchase"
    SALE = "sale"
    MOVE_IN = "move_in"
    MOVE_OUT = "move_out"
    RENT_START = "rent_start"
    RENT_END = "rent_end"
    RENOVATION = "renovation"
    INHERITANCE = "inheritance"
    GIFT = "gift"
    DEATH_OF_OWNER = "death_of_owner"
    MARRIAGE = "marriage"
    DIVORCE = "divorce"
    OTHER = "other"


class PropertyEvent(BaseModel):
    """A single event in the property timeline."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "event_type": "purchase",
                "event_date": "2015-03-15",
                "description": "Purchased family home",
                "amount": "850000.00"
            }
        }
    )

    event_type: EventType = Field(..., description="Type of event")
    event_date: date = Field(..., description="Date of the event")
    description: Optional[str] = Field(None, description="Additional details about the event")
    amount: Optional[Decimal] = Field(None, description="Amount in AUD if applicable (e.g., purchase price, renovation cost)")


class PropertyTimeline(BaseModel):
    """Complete property timeline data."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "property_address": "123 Example Street, Sydney NSW 2000",
                "property_type": "house",
                "acquisition_date": "2015-03-15",
                "acquisition_cost": "850000.00",
                "disposal_date": "2024-06-30",
                "disposal_proceeds": "1250000.00",
                "events": [
                    {
                        "event_type": "purchase",
                        "event_date": "2015-03-15",
                        "description": "Purchased family home",
                        "amount": "850000.00"
                    },
                    {
                        "event_type": "move_in",
                        "event_date": "2015-04-01",
                        "description": "Moved in as main residence"
                    },
                    {
                        "event_type": "move_out",
                        "event_date": "2020-01-15",
                        "description": "Relocated for work"
                    },
                    {
                        "event_type": "rent_start",
                        "event_date": "2020-02-01",
                        "description": "Started renting property"
                    },
                    {
                        "event_type": "sale",
                        "event_date": "2024-06-30",
                        "description": "Sold property",
                        "amount": "1250000.00"
                    }
                ],
                "owner_name": "John Smith",
                "ownership_percentage": "100",
                "is_pre_cgt": False,
                "cost_base_additions": "45000.00"
            }
        }
    )

    property_address: str = Field(..., description="Full address of the property")
    property_type: str = Field(..., description="Type of property (house, unit, land, etc.)")
    acquisition_date: date = Field(..., description="Date property was acquired")
    acquisition_cost: Decimal = Field(..., description="Cost base at acquisition in AUD")
    disposal_date: Optional[date] = Field(None, description="Date property was sold (if applicable)")
    disposal_proceeds: Optional[Decimal] = Field(None, description="Sale proceeds in AUD (if applicable)")
    events: list[PropertyEvent] = Field(default_factory=list, description="Timeline of property events")
    owner_name: str = Field(..., description="Name of the property owner")
    ownership_percentage: Decimal = Field(default=Decimal("100"), description="Percentage of ownership (0-100)")
    is_pre_cgt: bool = Field(default=False, description="Whether property was acquired before 20 Sep 1985")
    cost_base_additions: Optional[Decimal] = Field(None, description="Capital improvements and acquisition costs")


class AnalyzeRequest(BaseModel):
    """Request model for property analysis."""

    property_data: PropertyTimeline = Field(..., description="Property timeline data to analyze")
    additional_context: Optional[str] = Field(None, description="Any additional context for the analysis")


class UsageStats(BaseModel):
    """Token usage statistics from Claude API."""

    input_tokens: int = Field(..., description="Number of input tokens")
    output_tokens: int = Field(..., description="Number of output tokens")
    cache_creation_input_tokens: int = Field(default=0, description="Tokens used to create cache")
    cache_read_input_tokens: int = Field(default=0, description="Tokens read from cache")
    estimated_cost_usd: Decimal = Field(..., description="Estimated cost in USD")


class AnalyzeResponse(BaseModel):
    """Response model for property analysis."""

    analysis: str = Field(..., description="The CGT analysis from Claude")
    usage: UsageStats = Field(..., description="Token usage statistics")
    cached: bool = Field(..., description="Whether the system prompt was cached")
    model: str = Field(..., description="Model used for analysis")


class HealthResponse(BaseModel):
    """Response model for health check."""

    status: str = Field(..., description="Service status")
    version: str = Field(..., description="API version")
    service: str = Field(..., description="Service name")
