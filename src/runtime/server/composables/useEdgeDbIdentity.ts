import type { EventHandlerRequest, H3Event } from 'h3'
import { getCookie, sendRedirect, setCookie } from 'h3'
import { useEdgeDb } from './useEdgeDb'

interface UseEdgeDbIdentityData<T = any> {
  identity: T
  cookie: string
  update: (event?: H3Event) => Promise<void>
  logout: (redirectTo?: string) => Promise<void>
  isLoggedIn: boolean
}

export async function useEdgeDbIdentity<T>(
  req: H3Event<EventHandlerRequest> | undefined = undefined,
): Promise<UseEdgeDbIdentityData<T>> {
  const client = useEdgeDb(req)

  let token: string | undefined

  let user: T | undefined

  const update = async () => {
    if (req)
      token = getCookie(req, 'edgedb-auth-token')

    user = client.querySingle(`select global current_user;`) as T
  }

  const logout = async (redirectTo: string | undefined) => {
    if (!req)
      return

    setCookie(req, 'edgedb-auth-token', '')

    if (redirectTo)
      return sendRedirect(req, '/')
  }

  await update()

  const identityData = {
    isLoggedIn: !!user,
    identity: user,
    cookie: token,
    update,
    logout,
  } as UseEdgeDbIdentityData

  return identityData
}
