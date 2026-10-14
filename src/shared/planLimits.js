/**
 * Single source of truth for plan limits across server and client.
 */

export const PLAN_LIMITS = {
  trial:   { searchesTotal: 1, analysesTotal: 1 },   // lifetime, per account, never resets
  weekly:  { searchesPerDay: 2, analysesPerDay: 2 },
  monthly: { searchesPerDay: 5, analysesPerDay: 5 },
  yearly:  { searchesPerDay: "unlimited", analysesPerDay: "unlimited" }, // server ceiling applies
};

export const YEARLY_SERVER_CEILING = {
  searchesPerDay: 50,
  analysesPerDay: 50
};
