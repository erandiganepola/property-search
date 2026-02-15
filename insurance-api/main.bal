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

    // GET /api/plans — List all available insurance plans.
    resource function get plans() returns Plan[] {
        log:printInfo("GET /api/plans");
        return plans;
    }

    // POST /api/quotes — Generate an insurance quote.
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

        log:printInfo(string `Quote generated: ${quote.quoteId}, annual: $${quote.annualPremium}`);
        return quote;
    }
}
