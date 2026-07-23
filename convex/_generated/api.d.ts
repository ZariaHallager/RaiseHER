/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentActivityLog from "../agentActivityLog.js";
import type * as agents_acquisition from "../agents/acquisition.js";
import type * as agents_finance from "../agents/finance.js";
import type * as agents_growth from "../agents/growth.js";
import type * as agents_platformStats from "../agents/platformStats.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentActivityLog: typeof agentActivityLog;
  "agents/acquisition": typeof agents_acquisition;
  "agents/finance": typeof agents_finance;
  "agents/growth": typeof agents_growth;
  "agents/platformStats": typeof agents_platformStats;
  crons: typeof crons;
  http: typeof http;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
