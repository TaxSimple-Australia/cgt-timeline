"""Pydantic models for CGT Timeline Frontend format."""

from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel, ConfigDict, Field

if TYPE_CHECKING:
    from .schemas import UsageStats


class PropertyHistoryEvent(BaseModel):
    """A single event from the frontend timeline - matches frontend format exactly."""

    model_config = ConfigDict(extra="allow")  # Allow extra fields for flexibility

    date: str = Field(..., description="Event date in YYYY-MM-DD format")
    event: str = Field(..., description="Event type (purchase, sale, move_in, etc.)")
    price: Optional[Decimal] = Field(None, description="Price/amount for this event")
    description: Optional[str] = Field(None, description="Event description")
    contract_date: Optional[str] = Field(None, description="Contract date for sales")

    # Market value fields
    market_value: Optional[Decimal] = Field(None, description="Market value at event date")
    market_valuation: Optional[Decimal] = Field(None, description="Market valuation (legacy)")

    # Purchase cost base fields (Element 2 - Incidental costs of acquisition)
    stamp_duty: Optional[Decimal] = Field(None, description="Stamp duty paid")
    purchase_legal_fees: Optional[Decimal] = Field(None, description="Legal fees for purchase")
    valuation_fees: Optional[Decimal] = Field(None, description="Valuation fees")
    purchase_agent_fees: Optional[Decimal] = Field(None, description="Buyer's agent fees")
    building_inspection: Optional[Decimal] = Field(None, description="Building inspection cost")
    pest_inspection: Optional[Decimal] = Field(None, description="Pest inspection cost")
    title_legal_fees: Optional[Decimal] = Field(None, description="Title/search legal fees")
    loan_establishment: Optional[Decimal] = Field(None, description="Loan establishment fees")
    mortgage_insurance: Optional[Decimal] = Field(None, description="Lender's mortgage insurance")
    conveyancing_fees: Optional[Decimal] = Field(None, description="Conveyancing fees")
    survey_fees: Optional[Decimal] = Field(None, description="Survey fees")
    search_fees: Optional[Decimal] = Field(None, description="Title search fees")
    loan_application_fees: Optional[Decimal] = Field(None, description="Loan application fees")

    # Capital improvement fields (Element 3)
    improvement_cost: Optional[Decimal] = Field(None, description="Capital improvement cost")

    # Selling cost base fields (Element 5)
    legal_fees: Optional[Decimal] = Field(None, description="Legal fees for sale")
    agent_fees: Optional[Decimal] = Field(None, description="Real estate agent commission")
    advertising_costs: Optional[Decimal] = Field(None, description="Advertising costs")
    staging_costs: Optional[Decimal] = Field(None, description="Property staging costs")
    auction_costs: Optional[Decimal] = Field(None, description="Auction/auctioneer costs")
    mortgage_discharge_fees: Optional[Decimal] = Field(None, description="Mortgage discharge fees")

    # Land/building breakdown
    land_price: Optional[Decimal] = Field(None, description="Land component of price")
    building_price: Optional[Decimal] = Field(None, description="Building component of price")

    # Status flags
    is_ppr: Optional[bool] = Field(None, description="Is principal place of residence")


class TimelineProperty(BaseModel):
    """A property from the frontend timeline format."""

    address: str = Field(..., description="Property address")
    property_history: list[PropertyHistoryEvent] = Field(
        default_factory=list, description="Timeline events for this property"
    )
    notes: Optional[str] = Field(None, description="Additional notes about the property")


class AdditionalInfo(BaseModel):
    """Additional information for CGT analysis."""

    model_config = ConfigDict(extra="allow")

    australian_resident: bool = Field(default=True, description="Is Australian tax resident")
    other_property_owned: Optional[bool] = Field(None, description="Owns other properties")
    land_size_hectares: Optional[Decimal] = Field(None, description="Land size in hectares")
    marginal_tax_rate: Optional[Decimal] = Field(
        default=Decimal("37"), description="Marginal tax rate percentage"
    )


class PortfolioAnalyzeRequest(BaseModel):
    """Request model for portfolio analysis - matches frontend format."""

    model_config = ConfigDict(extra="allow")

    properties: list[TimelineProperty] = Field(
        ..., description="List of properties with their timeline histories"
    )
    user_query: Optional[str] = Field(
        default="Please analyze my CGT obligations for these properties",
        description="User's specific question",
    )
    additional_info: Optional[AdditionalInfo] = Field(
        default=None, description="Additional context for analysis"
    )
    use_claude: Optional[bool] = Field(
        default=True, description="Whether to use Claude for analysis"
    )


class PortfolioAnalyzeResponse(BaseModel):
    """Response model for portfolio analysis."""

    analysis: str = Field(..., description="The CGT analysis from Claude")
    properties: list[TimelineProperty] = Field(
        ..., description="The analyzed properties (echoed back)"
    )
    input_tokens: int = Field(..., description="Number of input tokens")
    output_tokens: int = Field(..., description="Number of output tokens")
    cached: bool = Field(..., description="Whether the system prompt was cached")
    model: str = Field(..., description="Model used for analysis")
    estimated_cost_usd: Decimal = Field(..., description="Estimated cost in USD")
