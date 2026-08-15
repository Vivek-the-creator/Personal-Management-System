import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { ROUTES } from "@/constants/app.constants";
import { AppLayout } from "@/components/layouts/AppLayout";
import { ProtectedRoute } from "@/components/layouts/ProtectedRoute";
import { GuestRoute } from "@/components/layouts/GuestRoute";
import { NotFoundPage } from "@/pages/NotFoundPage";

// ── Lazy page imports ──────────────────────────────────────────────────────────
const LandingPage = lazy(() =>
  import("@/pages/LandingPage").then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("@/pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const CalendarsPage = lazy(() =>
  import("@/pages/calendar/CalendarsPage").then((m) => ({ default: m.CalendarsPage }))
);
const TimelinePage = lazy(() =>
  import("@/pages/timeline/TimelinePage").then((m) => ({ default: m.TimelinePage }))
);
const SearchPage = lazy(() =>
  import("@/pages/search/SearchPage").then((m) => ({ default: m.SearchPage }))
);
const SettingsPage = lazy(() =>
  import("@/pages/settings/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const GeneralSettingsPage = lazy(() =>
  import("@/pages/settings/GeneralSettingsPage").then((m) => ({ default: m.GeneralSettingsPage }))
);
const AppearanceSettingsPage = lazy(() =>
  import("@/pages/settings/AppearanceSettingsPage").then((m) => ({
    default: m.AppearanceSettingsPage,
  }))
);
const AccountSettingsPage = lazy(() =>
  import("@/pages/settings/AccountSettingsPage").then((m) => ({ default: m.AccountSettingsPage }))
);
const NotificationsSettingsPage = lazy(() =>
  import("@/pages/settings/NotificationsSettingsPage").then((m) => ({
    default: m.NotificationsSettingsPage,
  }))
);
const AboutSettingsPage = lazy(() =>
  import("@/pages/settings/AboutSettingsPage").then((m) => ({ default: m.AboutSettingsPage }))
);

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const router = createBrowserRouter([
  // ── Public marketing page ──────────────────────────────────────────────────
  {
    path: ROUTES.HOME,
    element: <LandingPage />,
  },

  // ── Guest-only routes (redirect to /calendar if already logged in) ─────────
  {
    element: <GuestRoute />,
    children: [
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.REGISTER, element: <RegisterPage /> },
    ],
  },

  // ── Protected routes (redirect to /login if not authenticated) ────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Calendar is the app home screen after login
          { path: ROUTES.CALENDAR, element: <CalendarsPage /> },
          { path: ROUTES.TIMELINE, element: <TimelinePage /> },
          { path: ROUTES.SEARCH, element: <SearchPage /> },
          { path: ROUTES.SETTINGS, element: <SettingsPage /> },
          { path: ROUTES.SETTINGS_GENERAL, element: <GeneralSettingsPage /> },
          { path: ROUTES.SETTINGS_APPEARANCE, element: <AppearanceSettingsPage /> },
          { path: ROUTES.SETTINGS_ACCOUNT, element: <AccountSettingsPage /> },
          { path: ROUTES.SETTINGS_NOTIFICATIONS, element: <NotificationsSettingsPage /> },
          { path: ROUTES.SETTINGS_ABOUT, element: <AboutSettingsPage /> },
          // Legacy /dashboard → /calendar redirect
          { path: "/dashboard", element: <Navigate to={ROUTES.CALENDAR} replace /> },
          // Legacy /calendars → /calendar redirect
          { path: "/calendars", element: <Navigate to={ROUTES.CALENDAR} replace /> },
        ],
      },
    ],
  },

  // ── 404 ────────────────────────────────────────────────────────────────────
  { path: "/404", element: <NotFoundPage /> },
  { path: "*", element: <Navigate to="/404" replace /> },
]);

export function RouterProviderWrapper() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export { router };
