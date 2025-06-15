/**
 * Wouter compatibility helpers for TypeScript/CommonJS
 * This file provides pre-imported wouter exports to avoid ESM compatibility issues
 */

// Use CommonJS require to load wouter components
const wouter = require('wouter');

// Export all commonly used wouter components
module.exports = {
  // Core routing
  Route: wouter.Route,
  Switch: wouter.Switch,
  Link: wouter.Link,
  Redirect: wouter.Redirect,
  
  // Hooks
  useRoute: wouter.useRoute,
  useLocation: wouter.useLocation,
  useParams: wouter.useParams,
  
  // Router context
  Router: wouter.Router,
  useRouter: wouter.useRouter,
};
