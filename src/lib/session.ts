const LOCAL_TOKEN_KEY = 'incidentFrontend:token'
const SESSION_TOKEN_KEY = 'incidentFrontend:session-token'

function canUseStorage() {
  return typeof window !== 'undefined'
}

export function getStoredToken() {
  if (!canUseStorage()) {
    return null
  }

  return window.sessionStorage.getItem(SESSION_TOKEN_KEY) ?? window.localStorage.getItem(LOCAL_TOKEN_KEY)
}

export function storeToken(token: string, remember: boolean) {
  if (!canUseStorage()) {
    return
  }

  clearStoredToken()
  const storage = remember ? window.localStorage : window.sessionStorage
  const key = remember ? LOCAL_TOKEN_KEY : SESSION_TOKEN_KEY
  storage.setItem(key, token)
}

export function clearStoredToken() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(LOCAL_TOKEN_KEY)
  window.sessionStorage.removeItem(SESSION_TOKEN_KEY)
}
