# Insurance coverage plan/tier definition.
#
# + id - Plan identifier (`basic`, `standard`, or `premium`)
# + name - Display name of the plan
# + description - Short description of what the plan covers
# + deductible - Deductible amount in USD
# + coveragePercentage - Percentage of property value covered (80, 90, or 100)
# + features - List of coverage features included in this plan
type Plan record {|
    string id;
    string name;
    string description;
    decimal deductible;
    int coveragePercentage;
    string[] features;
|};

# Request payload for generating a property insurance quote.
#
# + state - US state name (e.g. California, Texas, Florida)
# + propertyValue - Property value in USD
# + propertyType - Property type: `sale`, `long-rent`, or `short-rent`
# + planId - Insurance plan ID: `basic`, `standard`, or `premium`
type QuoteRequest record {|
    string state;
    decimal propertyValue;
    string propertyType;
    string planId;
|};

# Risk factor breakdown included in a quote response.
#
# + stateRisk - Risk level for the state: `low`, `moderate`, `high`, or `very-high`
# + stateMultiplier - State-based geographic risk multiplier (0.85 to 1.45)
# + typeMultiplier - Property type risk multiplier
# + baseRate - Base insurance rate (0.35% of property value)
type RiskFactors record {|
    string stateRisk;
    decimal stateMultiplier;
    decimal typeMultiplier;
    decimal baseRate;
|};

# Generated insurance quote with premium breakdown.
#
# + quoteId - Unique quote identifier
# + state - US state for the property
# + propertyValue - Property value in USD
# + propertyType - Property type: `sale`, `long-rent`, or `short-rent`
# + plan - Selected insurance plan details
# + annualPremium - Calculated annual premium in USD
# + monthlyPremium - Calculated monthly premium in USD
# + coverageAmount - Total coverage amount in USD
# + deductible - Deductible amount in USD
# + riskFactors - Breakdown of risk factors used in the calculation
# + validUntil - Quote expiration date (ISO 8601)
type Quote record {|
    string quoteId;
    string state;
    decimal propertyValue;
    string propertyType;
    Plan plan;
    decimal annualPremium;
    decimal monthlyPremium;
    decimal coverageAmount;
    decimal deductible;
    RiskFactors riskFactors;
    string validUntil;
|};

# Error response body.
#
# + message - Human-readable error message
type ErrorResponse record {|
    string message;
|};
