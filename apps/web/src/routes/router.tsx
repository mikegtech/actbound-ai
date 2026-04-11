import App from "App";
import {
  Navigate,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import PageLoader from "components/loading/PageLoader";
import AuthGuard from "components/guard/AuthGuard";
import GuestGuard from "components/guard/GuestGuard";
import MainLayout from "layouts/main-layout";
import Page404 from "pages/errors/Page404";
import { lazy, Suspense } from "react";
import paths from "./paths";

// Domain pages
const Dashboard = lazy(() => import("pages/dashboard"));
const Assistants = lazy(() => import("pages/assistants"));
const AssistantDetail = lazy(() => import("pages/assistants/detail"));
const Organizations = lazy(() => import("pages/organizations"));
const OrganizationDetail = lazy(() => import("pages/organizations/detail"));
const Resources = lazy(() => import("pages/resources"));
const ResourceDetail = lazy(() => import("pages/resources/detail"));
const Policies = lazy(() => import("pages/policies"));
const PolicyDetail = lazy(() => import("pages/policies/detail"));
const PolicySimulation = lazy(() => import("pages/policies/simulation"));
const Delegations = lazy(() => import("pages/delegations"));
const Security = lazy(() => import("pages/security"));
const SecurityControls = lazy(() => import("pages/security/controls"));
const Audit = lazy(() => import("pages/audit"));
const Settings = lazy(() => import("pages/settings"));

const Login = lazy(() => import("pages/authentication/Login"));
const Callback = lazy(() => import("pages/authentication/Callback"));

export const SuspenseOutlet = () => {
  const { pathname } = useLocation();

  return (
    <Suspense key={pathname} fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
};

// Root route
const rootRoute = createRootRoute({
  component: App,
});

const mainLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "main",
  component: () => (
    <AuthGuard>
      <MainLayout>
        <SuspenseOutlet />
      </MainLayout>
    </AuthGuard>
  ),
});

// Primary Domain Routes attached to Main Layout
const dashboardRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "dashboard",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <Dashboard />
    </Suspense>
  ),
});

const assistantsRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "assistants",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <Assistants />
    </Suspense>
  ),
});

const assistantsDetailRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "assistants/$assistantId",
  component: () => {
    const { assistantId } = assistantsDetailRoute.useParams();
    return (
      <Suspense fallback={<PageLoader />}>
        <AssistantDetail id={assistantId} />
      </Suspense>
    );
  },
});

const organizationsRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "organizations",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <Organizations />
    </Suspense>
  ),
});

const organizationsDetailRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "organizations/$organizationId",
  component: () => {
    const { organizationId } = organizationsDetailRoute.useParams();
    return (
      <Suspense fallback={<PageLoader />}>
        <OrganizationDetail id={organizationId} />
      </Suspense>
    );
  },
});

const resourcesRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "resources",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <Resources />
    </Suspense>
  ),
});

const resourcesDetailRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "resources/$resourceId",
  component: () => {
    const { resourceId } = resourcesDetailRoute.useParams();
    return (
      <Suspense fallback={<PageLoader />}>
        <ResourceDetail id={resourceId} />
      </Suspense>
    );
  },
});

const policiesRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "policies",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <Policies />
    </Suspense>
  ),
});

const policiesDetailRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "policies/$policyId",
  component: () => {
    const { policyId } = policiesDetailRoute.useParams();
    return (
      <Suspense fallback={<PageLoader />}>
        <PolicyDetail id={policyId} />
      </Suspense>
    );
  },
});

const policiesSimulationRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "policies/$policyId/simulation",
  component: () => {
    const { policyId } = policiesSimulationRoute.useParams();
    return (
      <Suspense fallback={<PageLoader />}>
        <PolicySimulation id={policyId} />
      </Suspense>
    );
  },
});

const delegationsRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "delegations",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <Delegations />
    </Suspense>
  ),
});

const securityRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "security",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <Security />
    </Suspense>
  ),
});

const securityControlsRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "security/controls",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <SecurityControls />
    </Suspense>
  ),
});

const auditRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "audit",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <Audit />
    </Suspense>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "settings",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <Settings />
    </Suspense>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/",
  component: () => <Navigate to={paths.dashboard} replace />,
});

// Login and Auth0 routes mapped globally outside Main Layout
const authLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "login",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <GuestGuard>
        <Login />
      </GuestGuard>
    </Suspense>
  ),
});

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "callback",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <Callback />
    </Suspense>
  ),
});

// 404 catch-all
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: Page404,
});

// Build the route tree
const routeTree = rootRoute.addChildren([
  mainLayoutRoute.addChildren([
    indexRoute,
    dashboardRoute,
    assistantsRoute,
    assistantsDetailRoute,
    organizationsRoute,
    organizationsDetailRoute,
    resourcesRoute,
    resourcesDetailRoute,
    policiesRoute,
    policiesDetailRoute,
    policiesSimulationRoute,
    delegationsRoute,
    securityRoute,
    securityControlsRoute,
    auditRoute,
    settingsRoute,
  ]),
  authLoginRoute,
  authCallbackRoute,
  notFoundRoute,
]);

const router = createRouter({
  routeTree,
  basepath: import.meta.env.VITE_BASENAME || "/",
  defaultPreload: "intent",
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default router;
