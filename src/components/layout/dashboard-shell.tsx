"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { APP_ICON, APP_NAME } from "./nav-items";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const AppIcon = APP_ICON;

  return (
    <div className="flex min-h-svh">
      {/* Sidebar de escritorio */}
      <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 flex-col border-r md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <AppIcon className="size-4" />
          </div>
          {APP_NAME}
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="bg-background sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            {/* Navegación móvil */}
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Abrir menú"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="border-b">
                  <SheetTitle asChild>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 text-left"
                      onClick={() => setIsMobileNavOpen(false)}
                    >
                      <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <AppIcon className="size-4" />
                      </div>
                      {APP_NAME}
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <SidebarNav onNavigate={() => setIsMobileNavOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-semibold md:hidden">{APP_NAME}</span>
          </div>

          <UserMenu />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
