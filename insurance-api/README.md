# Insurance API

A property insurance quote REST API built with **Ballerina Swan Lake**. Given a US state, property value, and property type, it calculates insurance premiums based on geographic risk factors, property type, and coverage tier.

## Tech Stack

- **Language:** Ballerina Swan Lake (2201.13.1)
- **Protocol:** HTTP/REST
- **Port:** 3003

## Prerequisites

- [Ballerina Swan Lake](https://ballerina.io/downloads/) (Update 13+)

## Getting Started

### Build

```bash
bal build
```

### Run

```bash
bal run
```

The API starts at `http://localhost:3003`.

## API Endpoints

### GET /api/plans

List available insurance coverage plans.

```bash
curl http://localhost:3003/api/plans
```

**Response:** Array of 3 plans — Basic, Standard, Premium — each with different coverage limits, deductibles, and features.

### POST /api/quotes

Generate an insurance quote for a property.

```bash
curl -X POST http://localhost:3003/api/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "state": "California",
    "propertyValue": 875000,
    "propertyType": "sale",
    "planId": "standard"
  }'
```

| Field | Type | Description |
|-------|------|-------------|
| `state` | string | US state name (all 50 states supported) |
| `propertyValue` | number | Property value in USD |
| `propertyType` | string | `sale`, `long-rent`, or `short-rent` |
| `planId` | string | `basic`, `standard`, or `premium` |

**Response:** Quote with calculated annual/monthly premium, coverage amount, deductible, and risk factor breakdown.

Returns `400 Bad Request` for invalid state, property type, plan ID, or non-positive property value.

## Premium Calculation

```
annualPremium = propertyValue × baseRate × stateMultiplier × typeMultiplier × planMultiplier
```

| Factor | Values |
|--------|--------|
| **Base rate** | 0.35% of property value |
| **State multiplier** | 0.85 (Idaho, Wyoming) to 1.45 (Florida) — based on natural disaster and claim risk |
| **Type multiplier** | sale: 1.0, long-rent: 0.6 (renter's is cheaper), short-rent: 1.3 (higher turnover risk) |
| **Plan multiplier** | basic: 0.75, standard: 1.0, premium: 1.4 |

## Project Structure

```
insurance-api/
├── Ballerina.toml          # Package manifest
├── main.bal                # HTTP service with /plans and /quotes endpoints
├── types.bal               # Record type definitions
├── plans.bal               # Insurance plan data and lookup
├── quote_calculator.bal    # Premium calculation logic and validation
├── README.md
└── tests/                  # Test directory
```
