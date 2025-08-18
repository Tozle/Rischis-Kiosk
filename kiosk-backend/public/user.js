// Returns the current user object (with role) or null if not logged in
export async function getCurrentUser() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    if (data.loggedIn && data.user) return data.user;
    return null;
  } catch {
    return null;
  }
}
