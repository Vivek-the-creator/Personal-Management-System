import { Navigate, Outlet } from "react-router-dom";
import { useUserStore } from "@/store";
import { ROUTES } from "@/constants";

/**
 * ProtectedRoute — wraps routes that require authentication.
 *
 * - If not authenticated: redirect to /login (preserving the intended URL).
 * - If authenticated: render the nested route via <Outlet />.
 *
 * Note: isLoading state is handled at a higher level (AuthProvider / Suspense).
 * At this point the store has been rehydrated from localStorage so isAuthenticated
 * is the accurate persisted value. The SessionHydrator validates it with the server
 * in the background — if invalid, it calls logout() which triggers a re-render
 * and this guard redirects.
 */
export function ProtectedRoute() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
