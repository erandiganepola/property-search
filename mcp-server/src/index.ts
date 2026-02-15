#!/usr/bin/env node

import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
// import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { z } from "zod";
import { properties } from "./data/properties.js";
// import { createAsgardeoTokenVerifier } from "./auth/tokenVerifier.js";
import { filterByScopes, getAllowedTypes } from "./auth/scopeFilter.js";
import { getSessionUser } from "./auth/sessionContext.js";
import { findNeighborhood } from "./data/neighborhoods.js";
import {
  recordSearch,
  recordView,
  recordComparison,
  getUserActivity,
  generateUserProfile,
  scorePropertyMatch,
} from "./data/userActivity.js";

// --- Configuration ---
const PORT = parseInt(process.env.PORT || "3001", 10);
const ASGARDEO_BASE_URL = process.env.ASGARDEO_BASE_URL || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// if (!ASGARDEO_BASE_URL) {
//   console.error("ASGARDEO_BASE_URL environment variable is required");
//   process.exit(1);
// }

// --- Helper: extract userId from authInfo ---
function resolveSession(extra: { authInfo?: { clientId?: string; scopes?: string[] } }) {
  const clientId = extra.authInfo?.clientId ?? "unknown";
  const session = getSessionUser(clientId);
  const userId = session?.userId ?? clientId;
  const scopes = extra.authInfo?.scopes ?? [];
  return { clientId, userId, scopes };
}

// --- Create a fresh MCP Server instance (one per session) ---
function createServer() {
  const server = new McpServer({
    name: "property-search",
    version: "1.0.0",
  });

  // Tool 1: Search properties by state(s) — scope filtered, returns JSON
  server.tool(
    "search_properties",
    "Search for properties by US state(s). Optionally filter by property type. Results are filtered by the caller's token scopes.",
    {
      states: z.array(z.string()).describe('One or more US state names (e.g. ["California", "New York"])'),
      type: z.enum(["short-rent", "long-rent", "sale"]).optional().describe("Filter by property type"),
    },
    async ({ states, type }, extra) => {
      const { scopes, userId } = resolveSession(extra);
      console.log(`[Tool] search_properties — states: ${states.join(", ")}${type ? `, type: ${type}` : ""}, scopes: [${scopes.join(", ")}]`);

      const normalizedStates = states.map((s) => s.toLowerCase());

      let results = properties.filter((p) =>
        normalizedStates.includes(p.state.toLowerCase())
      );

      // Filter by user's scopes
      results = filterByScopes(results, scopes);

      // Filter by requested type
      if (type) {
        results = results.filter((p) => p.type === type);
      }

      // Record activity
      recordSearch(userId, {
        timestamp: Date.now(),
        states,
        type,
        resultsCount: results.length,
      });

      console.log(`[Tool] search_properties → ${results.length} results`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(results),
          },
        ],
      };
    }
  );

  // Tool 2: Get available states
  server.tool(
    "get_available_states",
    "List all US states that have properties available in the dataset.",
    {},
    async () => {
      const statesWithProperties = [...new Set(properties.map((p) => p.state))].sort();
      console.log(`[Tool] get_available_states → ${statesWithProperties.length} states`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(statesWithProperties),
          },
        ],
      };
    }
  );

  // Tool 3: Get property summary — scope filtered
  server.tool(
    "get_property_summary",
    "Get a summary of property counts by type. Optionally filter by state(s). Results are filtered by the caller's token scopes.",
    {
      states: z.array(z.string()).optional().describe("Filter by state(s). If omitted, returns summary for all states."),
    },
    async ({ states }, extra) => {
      const { scopes } = resolveSession(extra);
      console.log(`[Tool] get_property_summary — states: ${states?.join(", ") ?? "all"}`);
      let filtered = properties;

      if (states && states.length > 0) {
        const normalizedStates = states.map((s) => s.toLowerCase());
        filtered = filtered.filter((p) =>
          normalizedStates.includes(p.state.toLowerCase())
        );
      }

      filtered = filterByScopes(filtered, scopes);

      const allowedTypes = getAllowedTypes(scopes);
      const summary: Record<string, number> = { total: filtered.length };
      if (allowedTypes.has("short-rent")) {
        summary.shortTermRentals = filtered.filter((p) => p.type === "short-rent").length;
      }
      if (allowedTypes.has("long-rent")) {
        summary.longTermRentals = filtered.filter((p) => p.type === "long-rent").length;
      }
      if (allowedTypes.has("sale")) {
        summary.forSale = filtered.filter((p) => p.type === "sale").length;
      }

      console.log(`[Tool] get_property_summary → total: ${summary.total}`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(summary),
          },
        ],
      };
    }
  );

  // Tool 4: Get property details by ID
  server.tool(
    "get_property_details",
    "Get full details for a specific property by its ID. Access is filtered by scopes.",
    {
      id: z.number().describe("The property ID"),
    },
    async ({ id }, extra) => {
      const { scopes, userId } = resolveSession(extra);
      console.log(`[Tool] get_property_details — id: ${id}`);

      const property = properties.find((p) => p.id === id);
      if (!property) {
        console.log(`[Tool] get_property_details → not found`);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Property not found", id }) }],
        };
      }

      // Check scope access
      const scopeFiltered = filterByScopes([property], scopes);
      if (scopeFiltered.length === 0) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Not authorized to view this property type", id }) }],
        };
      }

      // Record view
      recordView(userId, id);

      console.log(`[Tool] get_property_details → ${property.title}, ${property.city}, ${property.state}`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(scopeFiltered[0]) }],
      };
    }
  );

  // Tool 5: Compare properties side-by-side
  server.tool(
    "compare_properties",
    "Compare 2-4 properties side-by-side. Returns comparison data including price, size, and feature differences. Access is filtered by scopes.",
    {
      ids: z.array(z.number()).min(2).max(4).describe("Array of 2-4 property IDs to compare"),
    },
    async ({ ids }, extra) => {
      const { scopes, userId } = resolveSession(extra);
      console.log(`[Tool] compare_properties — ids: ${ids.join(", ")}`);

      const found = ids
        .map((id) => properties.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => p !== undefined);

      if (found.length < 2) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Need at least 2 valid property IDs to compare", requestedIds: ids }) }],
        };
      }

      // Filter by scope
      const accessible = filterByScopes(found, scopes);

      if (accessible.length < 2) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Not enough accessible properties to compare (some may be restricted by scope)", accessibleCount: accessible.length }) }],
        };
      }

      // Record comparison
      recordComparison(userId, accessible.map((p) => p.id));

      const prices = accessible.map((p) => p.price);
      const sqfts = accessible.map((p) => p.sqft);

      const comparison = {
        properties: accessible,
        summary: {
          priceRange: { min: Math.min(...prices), max: Math.max(...prices), diff: Math.max(...prices) - Math.min(...prices) },
          sqftRange: { min: Math.min(...sqfts), max: Math.max(...sqfts), diff: Math.max(...sqfts) - Math.min(...sqfts) },
          states: [...new Set(accessible.map((p) => p.state))],
          types: [...new Set(accessible.map((p) => p.type))],
          bedroomRange: { min: Math.min(...accessible.map((p) => p.bedrooms)), max: Math.max(...accessible.map((p) => p.bedrooms)) },
        },
      };

      console.log(`[Tool] compare_properties → ${accessible.length} properties compared`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(comparison) }],
      };
    }
  );

  // Tool 6: Mortgage calculator (pure calculation, no auth filtering needed)
  server.tool(
    "calculate_mortgage",
    "Calculate monthly mortgage payment, total interest, and total cost for a given property price and loan terms.",
    {
      propertyPrice: z.number().describe("The property purchase price in dollars"),
      downPaymentPercent: z.number().min(0).max(100).default(20).describe("Down payment as a percentage of price (default: 20)"),
      annualInterestRate: z.number().default(6.5).describe("Annual interest rate as a percentage (default: 6.5)"),
      loanTermYears: z.number().default(30).describe("Loan term in years (default: 30)"),
    },
    async ({ propertyPrice, downPaymentPercent, annualInterestRate, loanTermYears }) => {
      console.log(`[Tool] calculate_mortgage — price: $${propertyPrice}, down: ${downPaymentPercent}%, rate: ${annualInterestRate}%, term: ${loanTermYears}yr`);
      const downPayment = propertyPrice * (downPaymentPercent / 100);
      const loanAmount = propertyPrice - downPayment;
      const monthlyRate = annualInterestRate / 100 / 12;
      const numberOfPayments = loanTermYears * 12;

      let monthlyPayment: number;
      if (monthlyRate === 0) {
        monthlyPayment = loanAmount / numberOfPayments;
      } else {
        // M = P[r(1+r)^n]/[(1+r)^n-1]
        const factor = Math.pow(1 + monthlyRate, numberOfPayments);
        monthlyPayment = loanAmount * (monthlyRate * factor) / (factor - 1);
      }

      const totalCost = monthlyPayment * numberOfPayments;
      const totalInterest = totalCost - loanAmount;

      const result = {
        propertyPrice,
        downPayment: Math.round(downPayment * 100) / 100,
        loanAmount: Math.round(loanAmount * 100) / 100,
        annualInterestRate,
        loanTermYears,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
      };

      console.log(`[Tool] calculate_mortgage → monthly: $${result.monthlyPayment}`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
      };
    }
  );

  // Tool 7: Get neighborhood info
  server.tool(
    "get_neighborhood_info",
    "Get neighborhood information for a city including walk score, safety rating, school rating, median income, top amenities, and transit score.",
    {
      city: z.string().describe("City name (e.g. 'Seattle')"),
      state: z.string().describe("State name (e.g. 'Washington')"),
    },
    async ({ city, state }) => {
      console.log(`[Tool] get_neighborhood_info — ${city}, ${state}`);
      const neighborhood = findNeighborhood(city, state);

      if (!neighborhood) {
        console.log(`[Tool] get_neighborhood_info → no data`);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "No neighborhood data available for this location", city, state }) }],
        };
      }

      console.log(`[Tool] get_neighborhood_info → found (walk: ${neighborhood.walkScore}, safety: ${neighborhood.safetyRating})`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(neighborhood) }],
      };
    }
  );

  // Tool 8: Get user profile from activity history
  server.tool(
    "get_user_profile",
    "Get a profile of the current user's search patterns and preferences, based on their activity history within this session.",
    {},
    async (_params, extra) => {
      const { userId } = resolveSession(extra);
      console.log(`[Tool] get_user_profile — user: ${userId}`);
      const activity = getUserActivity(userId);

      if (!activity) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ message: "No activity recorded yet. Search for properties, view details, or compare properties to build your profile." }) }],
        };
      }

      const profile = generateUserProfile(activity, properties);
      if (!profile) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ message: "Insufficient activity to generate a profile. Try searching for properties first." }) }],
        };
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(profile) }],
      };
    }
  );

  // Tool 9: Get personalized recommendations
  server.tool(
    "get_personalized_recommendations",
    "Get personalized property recommendations based on the current user's search history and preferences. Results are filtered by scopes.",
    {
      limit: z.number().min(1).max(10).default(5).describe("Maximum number of recommendations to return (default: 5)"),
    },
    async ({ limit }, extra) => {
      const { scopes, userId } = resolveSession(extra);
      console.log(`[Tool] get_personalized_recommendations — user: ${userId}, limit: ${limit}`);
      const activity = getUserActivity(userId);

      if (!activity) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ message: "No activity recorded yet. Search for properties to get personalized recommendations." }) }],
        };
      }

      const profile = generateUserProfile(activity, properties);
      if (!profile) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ message: "Insufficient activity to generate recommendations." }) }],
        };
      }

      // Filter all properties by scope
      const available = filterByScopes(properties, scopes);

      // Score and rank
      const scored = available.map((p) => ({
        property: p,
        matchScore: scorePropertyMatch(p, profile),
        reasons: buildMatchReasons(p, profile),
      }));

      scored.sort((a, b) => b.matchScore - a.matchScore);
      const recommendations = scored.slice(0, limit);

      console.log(`[Tool] get_personalized_recommendations → ${recommendations.length} recommendations`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ profile, recommendations }) }],
      };
    }
  );

  return server;
}

// Build human-readable match reasons
function buildMatchReasons(property: typeof properties[number], profile: ReturnType<typeof generateUserProfile>): string[] {
  if (!profile) return [];
  const reasons: string[] = [];

  if (profile.preferredStates.some((s) => s.toLowerCase() === property.state.toLowerCase())) {
    reasons.push(`Located in preferred state: ${property.state}`);
  }

  if (profile.intent === "buying" && property.type === "sale") {
    reasons.push("Matches your buying intent");
  } else if (profile.intent === "renting-short" && property.type === "short-rent") {
    reasons.push("Matches your short-term rental interest");
  } else if (profile.intent === "renting-long" && property.type === "long-rent") {
    reasons.push("Matches your long-term rental interest");
  }

  if (profile.budgetRange.max > 0) {
    if (property.price >= profile.budgetRange.min && property.price <= profile.budgetRange.max) {
      reasons.push("Within your budget range");
    }
  }

  if (profile.preferredSize.bedrooms > 0 && property.bedrooms === profile.preferredSize.bedrooms) {
    reasons.push(`Matches preferred bedroom count (${profile.preferredSize.bedrooms})`);
  }

  return reasons;
}

// --- Express + Transport Setup ---
const app = express();

app.use(cors({
  origin: CORS_ORIGIN,
  allowedHeaders: ["Content-Type", "Accept", "Authorization", "mcp-session-id"],
  exposedHeaders: ["mcp-session-id"],
}));
app.use(express.json());

// const verifier = createAsgardeoTokenVerifier(ASGARDEO_BASE_URL);
// const authMiddleware = requireBearerAuth({ verifier });

// Per-session transport map
const transports = new Map<string, StreamableHTTPServerTransport>();

app.all("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const method = req.body?.method ?? "(no method)";
  console.log(`[MCP] ${req.method} /mcp — method: ${method}, session: ${sessionId ?? "new"}`);

  if (req.method === "POST" && !sessionId) {
    // New session — create transport + connect server
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        console.log(`[MCP] Session created: ${id}`);
        transports.set(id, transport);
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        console.log(`[MCP] Session closed: ${transport.sessionId}`);
        transports.delete(transport.sessionId);
      }
    };

    const server = createServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    return;
  }

  // Existing session
  if (sessionId) {
    const transport = transports.get(sessionId);
    if (!transport) {
      console.log(`[MCP] Session not found: ${sessionId}`);
      res.status(404).json({ error: "Session not found" });
      return;
    }
    await transport.handleRequest(req, res, req.body);
    return;
  }

  res.status(400).json({ error: "Missing mcp-session-id header" });
});

app.listen(PORT, () => {
  console.log(`MCP Property Search server running on port ${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
  console.log(`Asgardeo base URL: ${ASGARDEO_BASE_URL}`);
});
