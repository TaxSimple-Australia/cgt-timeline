"""Portfolio analysis router for CGT Timeline frontend format."""

import asyncio
import json
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.claude_client import ClaudeClient
from app.config import Settings, get_settings
from app.models import PortfolioAnalyzeRequest, PortfolioAnalyzeResponse
from app.prompts import SYSTEM_PROMPT
from app.utils.async_helpers import CircuitBreakerOpen

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Portfolio Analysis"])


async def get_claude_client() -> ClaudeClient:
    return await ClaudeClient.get_instance()


async def get_app_settings() -> Settings:
    return get_settings()


ClaudeClientDep = Annotated[ClaudeClient, Depends(get_claude_client)]
SettingsDep = Annotated[Settings, Depends(get_app_settings)]


def format_portfolio_for_claude(body: PortfolioAnalyzeRequest) -> str:
    formatted_data = {
        "properties": [],
        "user_query": body.user_query or "Please analyze my CGT obligations",
        "additional_info": {
            "australian_resident": body.additional_info.australian_resident if body.additional_info else True,
            "marginal_tax_rate": float(body.additional_info.marginal_tax_rate) if body.additional_info and body.additional_info.marginal_tax_rate else 37,
        }
    }
    
    for prop in body.properties:
        property_data = {"address": prop.address, "property_history": [], "notes": prop.notes or ""}
        
        for event in prop.property_history:
            event_data = {"date": event.date, "event": event.event}
            if event.price is not None: event_data["price"] = float(event.price)
            if event.description: event_data["description"] = event.description
            if event.contract_date: event_data["contract_date"] = event.contract_date
            if event.market_value is not None: event_data["market_value"] = float(event.market_value)
            if event.stamp_duty is not None: event_data["stamp_duty"] = float(event.stamp_duty)
            if event.purchase_legal_fees is not None: event_data["purchase_legal_fees"] = float(event.purchase_legal_fees)
            if event.agent_fees is not None: event_data["agent_fees"] = float(event.agent_fees)
            if event.legal_fees is not None: event_data["legal_fees"] = float(event.legal_fees)
            if event.improvement_cost is not None: event_data["improvement_cost"] = float(event.improvement_cost)
            property_data["property_history"].append(event_data)
        formatted_data["properties"].append(property_data)
    
    return json.dumps(formatted_data, indent=2)


@router.post("/analyze-portfolio", response_model=PortfolioAnalyzeResponse)
async def analyze_portfolio(request: Request, body: PortfolioAnalyzeRequest, claude_client: ClaudeClientDep, settings: SettingsDep) -> PortfolioAnalyzeResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    logger.info(f"[{request_id}] Portfolio analysis request: {len(body.properties)} properties")

    try:
        formatted_data = format_portfolio_for_claude(body)
        user_query = body.user_query or "Please analyze my CGT obligations"
        
        user_message = f"""Please analyze the following property portfolio:

```json
{formatted_data}
```

User Question: {user_query}

Provide comprehensive CGT analysis following your system prompt format."""

        response = await asyncio.wait_for(
            claude_client.send_message(user_message=user_message, system_prompt=SYSTEM_PROMPT),
            timeout=settings.request_timeout_seconds,
        )

        logger.info(f"[{request_id}] Portfolio analysis completed")

        return PortfolioAnalyzeResponse(
            analysis=response.content,
            properties=body.properties,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
            cached=response.cached,
            model=response.model,
            estimated_cost_usd=response.usage.estimated_cost_usd,
        )

    except asyncio.TimeoutError:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Timeout")
    except CircuitBreakerOpen:
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
