# CGT Brain API

Australian Capital Gains Tax Calculator powered by Claude AI.

## Overview

CGT Brain API is a FastAPI backend that analyzes property timeline data and provides step-by-step CGT calculations based on ITAA97 rules. It uses Anthropic's Claude AI with prompt caching for cost-efficient analysis.

## Features

- **Property Timeline Analysis**: Submit property ownership data and receive detailed CGT calculations
- **ITAA97 Compliance**: Applies Australian tax law including main residence exemptions, absence rules, and CGT discount
- **Prompt Caching**: Reduces API costs by caching the system prompt (90% savings on cached tokens)
- **Cost Tracking**: Built-in cost calculator for monitoring API usage

## Quick Start

### 1. Install Dependencies

```bash
cd cgt-brain-api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 3. Run the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check

```http
GET /health
```

Returns service status.

### Analyze Property

```http
POST /api/analyze
Content-Type: application/json

{
  "property_data": {
    "property_address": "123 Example St, Sydney NSW 2000",
    "property_type": "house",
    "acquisition_date": "2015-03-15",
    "acquisition_cost": "850000.00",
    "disposal_date": "2024-06-30",
    "disposal_proceeds": "1250000.00",
    "events": [...],
    "owner_name": "John Smith",
    "ownership_percentage": "100",
    "is_pre_cgt": false,
    "cost_base_additions": "45000.00"
  },
  "additional_context": "Optional additional information"
}
```

#### Response

```json
{
  "analysis": "Detailed CGT analysis...",
  "usage": {
    "input_tokens": 1500,
    "output_tokens": 2000,
    "cache_creation_input_tokens": 1200,
    "cache_read_input_tokens": 0,
    "estimated_cost_usd": "0.015"
  },
  "cached": false,
  "model": "claude-sonnet-4-20250514"
}
```

## Property Event Types

| Event Type | Description |
|------------|-------------|
| `purchase` | Property acquired through purchase |
| `sale` | Property sold |
| `move_in` | Owner moved in as main residence |
| `move_out` | Owner moved out |
| `rent_start` | Property started being rented |
| `rent_end` | Rental period ended |
| `renovation` | Capital improvements made |
| `inheritance` | Property inherited |
| `gift` | Property received as gift |
| `death_of_owner` | Owner passed away |
| `marriage` | Marriage affecting ownership |
| `divorce` | Divorce affecting ownership |
| `other` | Other significant event |

## ITAA97 Sections Covered

The system prompt covers key tax provisions including:

- **s118-110 to s118-150**: Main residence exemption rules
- **s118-145**: 6-year absence rule
- **s118-165**: Partial exemption calculations
- **s118-185 to s118-195**: Inherited property rules
- **s115-25**: 50% CGT discount
- **s100-25**: Cost base elements
- **s104-10**: CGT event A1 (disposal)

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run only unit tests (skip integration tests requiring API key)
pytest -m "not integration"
```

## Project Structure

```
cgt-brain-api/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── claude_client.py     # Anthropic API wrapper
│   ├── prompts/
│   │   └── system_prompt.py # CGT analyst prompt
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   └── utils/
│       └── cost_calculator.py
├── tests/
│   ├── test_data.py         # Test fixtures
│   └── test_integration.py  # API tests
├── requirements.txt
├── .env.example
└── README.md
```

## Prompt Caching

The API uses Anthropic's prompt caching feature to reduce costs:

- First request: Creates cache (1.25x normal input cost)
- Subsequent requests: Reads from cache (0.1x normal input cost = 90% savings)
- Cache TTL: 5 minutes (ephemeral)

## CORS Configuration

Allowed origins:
- `https://ai.cgtbrain.com.au` (production)
- `http://localhost:3000` (development)
- `http://localhost:5173` (Vite development)

## License

Proprietary - CGT Brain Pty Ltd
