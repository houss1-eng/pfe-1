import { MenuItem } from "@/types/types";

// Chef / Admin menu
const chefMenuItems: MenuItem[] = [
  {
    id: "chef",
    icon: "NiHome",
    label: "Chef de Projet",
    description: "Gestion complète du projet",
    color: "text-primary",
    href: "/proflow/chef",
    children: [
      {
        id: "chef-dashboard",
        icon: "NiChartPie",
        label: "Tableau de bord",
        href: "/proflow/chef/dashboard",
        description: "KPI, pipeline et vue d'ensemble",
      },
      {
        id: "chef-team",
        icon: "NiUsers",
        label: "Équipe",
        href: "/proflow/chef/team",
        description: "Gestion des designers et développeurs",
      },
      {
        id: "chef-projects",
        icon: "NiCatalog",
        label: "Actions requises",
        href: "/proflow/chef/projects",
        description: "Projets nécessitant votre intervention",
      },
      {
        id: "chef-all-projects",
        icon: "NiFolder",
        label: "Tous les projets",
        href: "/proflow/chef/all-projects",
        description: "Vue complète de tous les projets",
      },
      {
        id: "chef-clients",
        icon: "NiUser",
        label: "Clients",
        href: "/proflow/chef/clients",
        description: "Aperçu par client",
      },
      {
        id: "chef-gestion-divider",
        label: "Gestion",
        divider: true,
      },
      {
        id: "chef-contract-generator",
        icon: "NiPen",
        label: "Contrats & Devis",
        href: "/proflow/chef/contract-generator",
        description: "Créer et envoyer un contrat PDF",
      },
      {
        id: "chef-planning",
        icon: "NiCalendar",
        label: "Planning",
        href: "/proflow/chef/planning",
        description: "Calendrier et échéances",
      },
      {
        id: "chef-reports",
        icon: "NiChartBar",
        label: "Rapports",
        href: "/proflow/chef/reports",
        description: "Statistiques et performances",
      },
      {
        id: "chef-contracts",
        icon: "NiDocumentFull",
        label: "Contrats signés",
        href: "/proflow/chef/contracts",
        description: "Suivi des contrats signés",
      },
    ],
  },
];

// Client menu
const clientMenuItems: MenuItem[] = [
  {
    id: "client",
    icon: "NiHome",
    label: "Espace Client",
    description: "Suivi de vos projets",
    color: "text-primary",
    href: "/proflow/client",
    children: [
      {
        id: "client-dashboard",
        icon: "NiChartPie",
        label: "Mes Projets",
        href: "/proflow/client/dashboard",
        description: "État et workflow de vos projets",
      },
      {
        id: "client-contracts",
        icon: "NiDocumentFull",
        label: "Mes Contrats",
        href: "/proflow/client/contracts",
        description: "Voir et signer vos contrats",
      },
    ],
  },
];

// Designer menu
const designerMenuItems: MenuItem[] = [
  {
    id: "designer",
    icon: "NiHome",
    label: "Espace Designer",
    description: "Vos tâches de design",
    color: "text-primary",
    href: "/proflow/designer",
    children: [
      {
        id: "designer-tasks",
        icon: "NiCatalog",
        label: "Mes Tâches",
        href: "/proflow/designer/tasks",
        description: "Tâches assignées",
      },
      {
        id: "designer-wireframes",
        icon: "NiScreen",
        label: "Mes Wireframes",
        href: "/proflow/designer/wireframes",
        description: "Wireframes sauvegardés",
      },
      {
        id: "designer-ai-history",
        icon: "NiAI",
        label: "Historique IA",
        href: "/proflow/designer/ai-history",
        description: "Wireframes générés par IA",
      },
      {
        id: "designer-n8n",
        icon: "NiPalette",
        label: "Génération IA",
        href: "/proflow/designer/n8n",
        description: "Générer avec n8n",
      },
    ],
  },
];

// Developer menu
const developerMenuItems: MenuItem[] = [
  {
    id: "developer",
    icon: "NiHome",
    label: "Espace Développeur",
    description: "Vos tâches de développement",
    color: "text-primary",
    href: "/proflow/developer",
    children: [
      {
        id: "developer-tasks",
        icon: "NiCatalog",
        label: "Mes Tâches",
        href: "/proflow/developer/tasks",
        description: "Tâches de développement assignées",
      },
    ],
  },
];

// All items combined for route generation (routes.tsx needs all paths)
export const leftMenuItems: MenuItem[] = [
  ...chefMenuItems,
  ...clientMenuItems,
  ...designerMenuItems,
  ...developerMenuItems,
];

export const leftMenuBottomItems: MenuItem[] = [
  { id: "settings", label: "Paramètres", href: "/settings", icon: "NiSettings" },
];

// Role-based menu export (used by LeftMenu to filter display)
export const getRoleMenuItems = (role?: string): MenuItem[] => {
  switch (role) {
    case 'chef': return chefMenuItems;
    case 'client': return clientMenuItems;
    case 'designer': return designerMenuItems;
    case 'developer': return developerMenuItems;
    default: return [];
  }
};
