// Insurance plan definitions and lookup.

final Plan[] & readonly plans = [
    {
        id: "basic",
        name: "Basic",
        description: "Essential coverage for budget-conscious owners",
        deductible: 2500,
        coveragePercentage: 80,
        features: ["Dwelling coverage", "Personal property", "Liability protection"]
    },
    {
        id: "standard",
        name: "Standard",
        description: "Balanced coverage for most homeowners",
        deductible: 1500,
        coveragePercentage: 90,
        features: [
            "Dwelling coverage",
            "Personal property",
            "Liability protection",
            "Additional living expenses",
            "Medical payments"
        ]
    },
    {
        id: "premium",
        name: "Premium",
        description: "Comprehensive full-replacement coverage",
        deductible: 500,
        coveragePercentage: 100,
        features: [
            "Full replacement dwelling",
            "Personal property",
            "Liability protection",
            "Additional living expenses",
            "Medical payments",
            "Natural disaster",
            "Water backup"
        ]
    }
];

// Look up a plan by ID. Returns nil if not found.
function getPlan(string planId) returns Plan? {
    foreach Plan p in plans {
        if p.id == planId {
            return p;
        }
    }
    return ();
}
