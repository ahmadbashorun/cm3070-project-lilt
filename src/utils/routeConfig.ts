export interface RouteConfig {
  path: string;
  protected: boolean;
  redirectIfAuthenticated?: boolean;
}

export const routes: RouteConfig[] = [
  { path: "/", protected: false, redirectIfAuthenticated: true },
  { path: "/login", protected: false, redirectIfAuthenticated: true },
  { path: "/verification", protected: false },
  { path: "/onboarding", protected: true },
  { path: "/dashboard", protected: true },
];

export const getRouteConfig = (pathname: string): RouteConfig | undefined => {
  return routes.find((route) => route.path === pathname);
};

export const isProtectedRoute = (pathname: string): boolean => {
  const config = getRouteConfig(pathname);
  return config?.protected ?? false;
};

export const shouldRedirectIfAuthenticated = (pathname: string): boolean => {
  const config = getRouteConfig(pathname);
  return config?.redirectIfAuthenticated ?? false;
};
