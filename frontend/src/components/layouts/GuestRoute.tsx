import { Navigate, Outlet } from "react-router-dom";
import { useUserStore } from "@/store";
import { ROUTES } from "@/constants";

/**
 * GuestRoute — wraps routes that should only be accessible when NOT authenticated.
 * (e.g., /login, /register)
 *
 * If already authenticated, redirects to the calendar (home screen).
 */
export function GuestRoute() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.CALENDAR} replace />;
  }

  return <Outlet />;
}
