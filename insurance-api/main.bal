import ballerina/http;
import ballerina/log;

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:5173"],
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type"]
    }
}
service /api on new http:Listener(3003) {

    # List all available property insurance coverage plans.
    #
    # Returns the Basic, Standard, and Premium plans with their
    # deductibles, coverage percentages, and included features.
    #
    # + return - Array of available insurance plans
    resource function get plans() returns Plan[] {
        log:printInfo(string `GET /api/plans → returning ${plans.length()} plans`);
        return plans;
    }

    # Generate a property insurance quote.
    #
    # Calculates an insurance premium based on the property's US state,
    # value, type (sale, long-rent, or short-rent), and the selected
    # insurance plan. The premium factors in geographic risk, property
    # type risk, and plan tier.
    #
    # + req - Quote request with state, property value, type, and plan ID
    # + return - Insurance quote with premium breakdown, or 400 if validation fails
    resource function post quotes(@http:Payload QuoteRequest req) returns Quote|http:BadRequest {
        log:printInfo(string `POST /api/quotes — state: ${req.state}, value: ${req.propertyValue}, type: ${req.propertyType}, plan: ${req.planId}`);

        // Validate
        string? validationError = validateRequest(req);
        if validationError is string {
            log:printWarn(string `Validation failed: ${validationError}`);
            return <http:BadRequest>{
                body: <ErrorResponse>{message: validationError}
            };
        }

        // Calculate
        Plan plan = <Plan>getPlan(req.planId);
        Quote quote = calculateQuote(req, plan);

        log:printInfo(string `Quote generated: ${quote.quoteId}, annual: $${quote.annualPremium}, monthly: $${quote.monthlyPremium}, risk: ${quote.riskFactors.stateRisk}`);
        return quote;
    }
}
