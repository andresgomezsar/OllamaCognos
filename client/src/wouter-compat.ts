/**
 * Wouter compatibility helpers for TypeScript/ESM
 * This file provides pre-imported wouter exports with proper TypeScript typing
 */

// Use ESM import to load wouter components
import * as wouter from 'wouter';
import { ComponentType, ReactNode } from 'react';

// Types for commonly used wouter components
type RouteProps = {
  path?: string; // Optional to allow catch-all routes
  children: ReactNode | ((params: any) => ReactNode);
  // Using 'any' for params is acceptable here as it represents dynamic route parameters
  // that will have different shapes depending on the route pattern
};

type SwitchProps = {
  children: ReactNode;
  location?: string;
};

type LinkProps = {
  href: string;
  children: ReactNode;
  [key: string]: any;
};

type RedirectProps = {
  to: string;
  replace?: boolean;
};

// Export all commonly used wouter components with types
export const Route: ComponentType<RouteProps> = wouter.Route;
export const Switch: ComponentType<SwitchProps> = wouter.Switch;
export const Link: ComponentType<LinkProps> = wouter.Link;
export const Redirect: ComponentType<RedirectProps> = wouter.Redirect;

// Hooks
export const useRoute = wouter.useRoute;
export const useLocation = wouter.useLocation;
export const useParams = wouter.useParams;

// Router context
export const Router = wouter.Router;
export const useRouter = wouter.useRouter;
