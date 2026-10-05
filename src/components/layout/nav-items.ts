import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BarChart3,
  CircleDollarSign,
  LayoutDashboard,
  Landmark,
  Repeat,
  Tag,
  Wallet,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Módulos que se implementan en fases posteriores (4-5). */
  comingSoon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Cuentas", href: "/accounts", icon: Landmark },
  { label: "Movimientos", href: "/transactions", icon: ArrowLeftRight },
  { label: "Categorías", href: "/categories", icon: Tag },
  {
    label: "Gastos recurrentes",
    href: "/recurring-expenses",
    icon: Repeat,
    comingSoon: true,
  },
  {
    label: "Deudas",
    href: "/debts",
    icon: CircleDollarSign,
  },
  {
    label: "Estadísticas",
    href: "/statistics",
    icon: BarChart3,
  },
];

export const APP_NAME = "Finanzas Personales";
export const APP_ICON = Wallet;
