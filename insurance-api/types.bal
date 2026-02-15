// Record types for the Property Insurance Quote API.

// Insurance plan/tier definition.
type Plan record {|
    string id;
    string name;
    string description;
    decimal deductible;
    int coveragePercentage;
    string[] features;
|};

// Request payload for creating a quote.
type QuoteRequest record {|
    string state;
    decimal propertyValue;
    string propertyType;   // "sale", "long-rent", "short-rent"
    string planId;         // "basic", "standard", "premium"
|};

// Risk factor breakdown included in quote response.
type RiskFactors record {|
    string stateRisk;         // "low", "medium", "high"
    decimal stateMultiplier;
    decimal typeMultiplier;
    decimal baseRate;
|};

// Generated insurance quote.
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

// Error response body.
type ErrorResponse record {|
    string message;
|};
