#!/bin/bash

# Script de configuration CI/CD pour MedFlow
# Usage: ./setup-ci-cd.sh

set -e

echo "🚀 Configuration CI/CD pour MedFlow"
echo "===================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo "❌ Erreur: Ce script doit être exécuté à la racine du projet"
    exit 1
fi

echo -e "${YELLOW}📋 Étapes de configuration:${NC}"
echo "1. Vérifier les prérequis"
echo "2. Configurer les secrets GitHub"
echo "3. Tester le pipeline localement"
echo ""

# 1. Vérifier les prérequis
echo -e "${GREEN}✅ Vérification des prérequis...${NC}"

# Vérifier GitHub CLI
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI installé"
else
    echo "⚠️  GitHub CLI non installé (optionnel)"
fi

# Vérifier Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker installé"
else
    echo "❌ Docker non installé - requis pour le build"
    exit 1
fi

# Vérifier kubectl
if command -v kubectl &> /dev/null; then
    echo "✅ kubectl installé"
else
    echo "⚠️  kubectl non installé (requis pour le déploiement)"
fi

echo ""
echo -e "${YELLOW}📝 Configuration des secrets GitHub:${NC}"
echo ""
echo "Pour configurer les secrets, allez sur GitHub:"
echo "https://github.com/VOTRE_USERNAME/VOTRE_REPO/settings/secrets/actions"
echo ""
echo "Secrets à configurer:"
echo "  - KUBECONFIG (base64 encodé)"
echo "  - VITE_API_BASE_URL (optionnel)"
echo ""

# Générer KUBECONFIG encodé si kubectl est disponible
if command -v kubectl &> /dev/null; then
    if [ -f "$HOME/.kube/config" ]; then
        echo -e "${GREEN}📦 Génération du KUBECONFIG encodé...${NC}"
        KUBECONFIG_B64=$(cat ~/.kube/config | base64 -w 0 2>/dev/null || cat ~/.kube/config | base64)
        echo ""
        echo "Copiez cette valeur dans le secret GitHub 'KUBECONFIG':"
        echo "$KUBECONFIG_B64"
        echo ""
    else
        echo "⚠️  Fichier kubeconfig non trouvé"
    fi
fi

echo -e "${YELLOW}🧪 Test local du pipeline:${NC}"
echo ""
echo "Pour tester le pipeline localement, utilisez act:"
echo "  https://github.com/nektos/act"
echo ""
echo "Ou testez manuellement chaque étape:"
echo "  1. Tests: npm test dans chaque dossier"
echo "  2. Build: docker build dans chaque dossier"
echo "  3. Deploy: kubectl apply -f k8s/"
echo ""

echo -e "${GREEN}✅ Configuration terminée!${NC}"
echo ""
echo "Prochaines étapes:"
echo "  1. Configurez les secrets sur GitHub"
echo "  2. Poussez votre code vers GitHub"
echo "  3. Le pipeline s'exécutera automatiquement"
echo ""

