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
import type * as agents_support from "../agents/support.js";
import type * as caseFileAction from "../caseFileAction.js";
import type * as caseFiles from "../caseFiles.js";
import type * as circle from "../circle.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as lib_gemini from "../lib/gemini.js";
import type * as payGap from "../payGap.js";
import type * as payGapAction from "../payGapAction.js";
import type * as payGapMutations from "../payGapMutations.js";
import type * as rehearsal from "../rehearsal.js";
import type * as rehearsalAction from "../rehearsalAction.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";
import type * as wins from "../wins.js";
import type * as winsAction from "../winsAction.js";

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
  "agents/support": typeof agents_support;
  caseFileAction: typeof caseFileAction;
  caseFiles: typeof caseFiles;
  circle: typeof circle;
  crons: typeof crons;
  dashboard: typeof dashboard;
  http: typeof http;
  "lib/gemini": typeof lib_gemini;
  payGap: typeof payGap;
  payGapAction: typeof payGapAction;
  payGapMutations: typeof payGapMutations;
  rehearsal: typeof rehearsal;
  rehearsalAction: typeof rehearsalAction;
  stripe: typeof stripe;
  users: typeof users;
  wins: typeof wins;
  winsAction: typeof winsAction;
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
