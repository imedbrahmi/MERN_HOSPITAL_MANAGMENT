import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { Context } from "../main";

/**
 * RouteGuard - Protège les routes selon le rôle de l'utilisateur
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Le composant à afficher si l'accès est autorisé
 * @param {string[]} props.allowedRoles - Les rôles autorisés à accéder à cette route
 * @param {boolean} props.requireAuth - Si true, l'utilisateur doit être authentifié (défaut: true)
 */
const RouteGuard = ({ children, allowedRoles = [], requireAuth = true }) => {
  const { isAuthenticated, user } = useContext(Context);

  // Si l'authentification est requise et que l'utilisateur n'est pas authentifié
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si des rôles sont spécifiés, vérifier que l'utilisateur a un des rôles autorisés
  if (allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      // Rediriger vers la page d'accueil si l'utilisateur n'a pas le bon rôle
      return <Navigate to="/" replace />;
    }
  }

  // Accès autorisé
  return <>{children}</>;
};

export default RouteGuard;

