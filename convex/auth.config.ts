/**
 * Convex JWT authentication configuration.
 *
 * Clerk issues JWTs for the Convex audience ("convex"). Convex fetches
 * {domain}/.well-known/openid-configuration at startup to discover the JWKS
 * endpoint and caches the signing keys.
 *
 * Without this file ctx.auth.getUserIdentity() always returns null.
 */
export default {
  providers: [
    {
      domain: 'https://worthy-dassie-7.clerk.accounts.dev',
      applicationID: 'convex',
    },
  ],
}
