import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { leftMenuBottomItems, leftMenuItems } from "@/menu-items";
import AppLayout from "@/pages/app/layout";
import AuthLayout from "@/pages/auth/layout";
import Loading from "@/pages/loading.tsx";
import NotFound from "@/pages/not-found";
import { MenuItem } from "@/types/types";
import { useAuth } from "@/context/AuthContext";

// Statically import all possible pages for build
const modules = import.meta.glob("./pages/**/page.tsx");

// Lazy load page components
const lazyLoad = (path: string) => {
  let key: string;
  if (path.startsWith("/auth")) {
    key = `./pages/auth${path.substring(5)}/page.tsx`;
  } else {
    key = `./pages/app${path}/page.tsx`;
  }

  const importer = modules[key];
  if (!importer) return <Navigate to="/404" replace />;

  const Component = React.lazy(importer as () => Promise<{ default: React.ComponentType<unknown> }>);

  return (
    <React.Suspense fallback={<Loading />}>
      <Component />
    </React.Suspense>
  );
};

// Recursively generate routes from menu items
const generateRoutesFromMenuItems = (menuItems: MenuItem[]): React.ReactElement[] => {
  return menuItems.flatMap((item: MenuItem) => {
    const routes: React.ReactElement[] = [];
    if (item.isExternalLink || !item.href) return [];
    routes.push(<Route key={item.id} path={item.href} element={lazyLoad(item.href)} />);
    if (item.children && item.children.length > 0) {
      routes.push(...generateRoutesFromMenuItems(item.children));
    }
    return routes;
  });
};

const generateAuthRoutes = (): React.ReactElement[] => [
  <Route key="sign-in" path="sign-in" element={lazyLoad("/auth/sign-in")} />,
];

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  return <>{children}</>;
}

// Role-based default redirect after login
function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/auth/sign-in" replace />;
  const defaults: Record<string, string> = {
    chef: '/proflow/chef/dashboard',
    client: '/proflow/client/dashboard',
    designer: '/proflow/designer/tasks',
    developer: '/proflow/developer/tasks',
  };
  return <Navigate to={defaults[user.role] || '/proflow/chef/dashboard'} replace />;
}

const mainRoutes = generateRoutesFromMenuItems(leftMenuItems);
const bottomRoutes = generateRoutesFromMenuItems(leftMenuBottomItems);
const authRoutes = generateAuthRoutes();

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root — redirect to app (handles auth + role redirect) */}
      <Route path="/" element={<Navigate to="/app" replace />} />

      {/* /app → role-based dashboard redirect */}
      <Route path="/app" element={<RoleRedirect />} />

      {/* App routes with AppLayout (protected) */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {mainRoutes}
        {bottomRoutes}
      </Route>

      {/* Auth routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="/auth/sign-in" replace />} />
        {authRoutes}
      </Route>

      {/* 404 */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
