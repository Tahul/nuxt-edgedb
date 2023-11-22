import crypto from 'node:crypto'

/**
 * Generate a random Base64 url-encoded string, and derive a "challenge"
 * string from that string to use as proof that the request for a token
 * later is made from the same user agent that made the original request
 *
 * @returns {object} The verifier and challenge strings
 */
export function useEdgeDbPKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url')

  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url')

  return { verifier, challenge }
}
