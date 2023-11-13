import { useNitroApp } from '#imports'
import { defineEventHandler, H3Error, setHeaders, getCookie, getRequestURL } from "h3";

/**
 * Handles the PKCE callback and exchanges the `code` and `verifier`
 * for an auth_token, setting the auth_token as an HttpOnly cookie.
 *
 * @param {Request} req
 */
export default defineEventHandler(async (req) => {
  const { authBaseUrl } = useEdgeDbEnv();

  console.log(useNitroApp())

  const requestUrl = getRequestURL(req);
  const code = requestUrl.searchParams.get("code");
  if (!code) {
    const error = requestUrl.searchParams.get("error");
    const err = new H3Error(`OAuth callback is missing 'code'. OAuth provider responded with error: ${error}`);
    err.statusCode = 400;
    return err;
  }

  const verifier = getCookie(req, 'edgedb-pkce-verifier');
  if (!verifier) {
    const err = new H3Error(`Could not find 'verifier' in the cookie store. Is this the same user agent/browser that started the authorization flow?`);
    err.statusCode = 400;
    return err;
  }

  const codeExchangeUrl = new URL("token", authBaseUrl);
  codeExchangeUrl.searchParams.set("code", code);
  codeExchangeUrl.searchParams.set("verifier", verifier);
  const codeExchangeResponse = await fetch(codeExchangeUrl.href, {
    method: "GET",
  });

  if (!codeExchangeResponse.ok) {
    const err = new H3Error(await codeExchangeResponse.text());
    err.statusCode = 400;
    return err;
  }

  const codeExchangeResponseData = await codeExchangeResponse.json();

  console.log({
    code,
    verifier,
    codeExchangeUrl,
    codeExchangeResponse,
  })

  setHeaders(req, {
    "Set-Cookie": `edgedb-auth-token=${codeExchangeResponseData.auth_token}; Path=/; HttpOnly`,
  });
});
