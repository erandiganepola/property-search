import ballerina/time;
import ballerina/uuid;

// Base annual rate as a percentage of property value.
const decimal BASE_RATE = 0.0035;

// State risk multipliers — higher = more expensive to insure.
final map<decimal> & readonly stateMultipliers = {
    "Alabama": 1.10,
    "Alaska": 1.05,
    "Arizona": 1.05,
    "Arkansas": 1.10,
    "California": 1.35,
    "Colorado": 0.90,
    "Connecticut": 0.95,
    "Delaware": 0.95,
    "Florida": 1.45,
    "Georgia": 1.15,
    "Hawaii": 1.20,
    "Idaho": 0.85,
    "Illinois": 1.05,
    "Indiana": 1.00,
    "Iowa": 1.00,
    "Kansas": 1.10,
    "Kentucky": 1.05,
    "Louisiana": 1.40,
    "Maine": 0.90,
    "Maryland": 1.00,
    "Massachusetts": 1.00,
    "Michigan": 1.00,
    "Minnesota": 0.95,
    "Mississippi": 1.20,
    "Missouri": 1.10,
    "Montana": 0.90,
    "Nebraska": 1.05,
    "Nevada": 1.00,
    "New Hampshire": 0.90,
    "New Jersey": 1.05,
    "New Mexico": 1.00,
    "New York": 1.20,
    "North Carolina": 1.10,
    "North Dakota": 0.90,
    "Ohio": 1.00,
    "Oklahoma": 1.25,
    "Oregon": 0.95,
    "Pennsylvania": 1.00,
    "Rhode Island": 0.95,
    "South Carolina": 1.15,
    "South Dakota": 0.90,
    "Tennessee": 1.10,
    "Texas": 1.25,
    "Utah": 0.90,
    "Vermont": 0.90,
    "Virginia": 1.00,
    "Washington": 0.95,
    "West Virginia": 1.00,
    "Wisconsin": 0.95,
    "Wyoming": 0.85
};

// Property type multipliers.
final map<decimal> & readonly typeMultipliers = {
    "sale": 1.0,
    "long-rent": 0.6,
    "short-rent": 1.3
};

// Plan tier multipliers.
final map<decimal> & readonly planMultipliers = {
    "basic": 0.75,
    "standard": 1.0,
    "premium": 1.4
};

// Determine risk category from state multiplier.
function getRiskLevel(decimal multiplier) returns string {
    if multiplier >= 1.3d {
        return "high";
    }
    if multiplier >= 1.05d {
        return "medium";
    }
    return "low";
}

// Validate a quote request. Returns an error message or nil if valid.
function validateRequest(QuoteRequest req) returns string? {
    if req.propertyValue <= 0d {
        return "propertyValue must be greater than 0";
    }
    if !stateMultipliers.hasKey(req.state) {
        return string `Unknown state: ${req.state}`;
    }
    if !typeMultipliers.hasKey(req.propertyType) {
        return string `Unknown propertyType: ${req.propertyType}. Must be sale, long-rent, or short-rent`;
    }
    Plan? plan = getPlan(req.planId);
    if plan is () {
        return string `Unknown planId: ${req.planId}. Must be basic, standard, or premium`;
    }
    return ();
}

// Calculate a quote from a validated request and plan.
function calculateQuote(QuoteRequest req, Plan plan) returns Quote {
    decimal stateMul = stateMultipliers.get(req.state);
    decimal typeMul = typeMultipliers.get(req.propertyType);
    decimal planMul = planMultipliers.get(req.planId);

    decimal annualPremium = req.propertyValue * BASE_RATE * stateMul * typeMul * planMul;
    // Round to 2 decimal places
    annualPremium = decimal:round(annualPremium, 2);
    decimal monthlyPremium = decimal:round(annualPremium / 12d, 2);

    decimal coverageAmount = req.propertyValue * (<decimal>plan.coveragePercentage / 100d);
    coverageAmount = decimal:round(coverageAmount, 2);

    // Valid for 30 days from now
    time:Utc now = time:utcNow();
    time:Utc expiry = time:utcAddSeconds(now, 30 * 24 * 60 * 60);
    string validUntil = time:utcToString(expiry).substring(0, 10);

    string quoteId = string `QT-${uuid:createRandomUuid().substring(0, 8)}`;

    return {
        quoteId: quoteId,
        state: req.state,
        propertyValue: req.propertyValue,
        propertyType: req.propertyType,
        plan: plan,
        annualPremium: annualPremium,
        monthlyPremium: monthlyPremium,
        coverageAmount: coverageAmount,
        deductible: plan.deductible,
        riskFactors: {
            stateRisk: getRiskLevel(stateMul),
            stateMultiplier: stateMul,
            typeMultiplier: typeMul,
            baseRate: BASE_RATE
        },
        validUntil: validUntil
    };
}
