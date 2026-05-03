"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboardIcon,
  UsersIcon,
  ShoppingBagIcon,
  UserCheckIcon,
  BanknoteIcon,
  BookOpenIcon,
  BarChart3Icon,
  SettingsIcon,
  MenuIcon,
  WheatIcon,
  LogOutIcon,
  ChevronRightIcon,
  GlobeIcon,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "dashboard", icon: LayoutDashboardIcon },
  { href: "/lots", label: "lots", icon: ShoppingBagIcon },
  { href: "/farmers", label: "farmers", icon: UsersIcon },
  { href: "/traders", label: "traders", icon: UserCheckIcon },
  { href: "/loans", label: "loans", icon: BanknoteIcon },
  { href: "/ledger", label: "ledger", icon: BookOpenIcon },
  { href: "/reports", label: "reports", icon: BarChart3Icon },
  { href: "/settings", label: "settings", icon: SettingsIcon },
] as const;

const printItems = [
  { href: "/print/rojnamcha", label: "रोजनामचा" },
  { href: "/print/rokad", label: "रोकड़" },
];

type NavLabel = (typeof navItems)[number]["label"];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="flex flex-col gap-1 px-2 py-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {t[item.label as NavLabel]}
          </Link>
        );
      })}
      <div className="mt-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Registers
      </div>
      {printItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <BarChart3Icon className="size-4 shrink-0" />
          {item.label}
        </a>
      ))}
    </nav>
  );
}

function SidebarLogo() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <WheatIcon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight">Arhatiya Portal</p>
        <p className="text-xs text-muted-foreground">Mandi Management</p>
      </div>
    </div>
  );
}

function Breadcrumb() {
  const pathname = usePathname();
  const { t } = useI18n();

  const segments = pathname.split("/").filter(Boolean);
  const items = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = t[seg as NavLabel] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
    return { href, label };
  });

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <span key={item.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRightIcon className="size-3.5" />}
          {i === items.length - 1 ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { lang, setLang, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userName = session?.user?.name ?? "Agent";
  const firmName = (session?.user as { firmName?: string })?.firmName ?? "Arhatiya Portal";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-background lg:flex">
        <SidebarLogo />
        <Separator />
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav />
        </div>
        <Separator />
        <div className="p-3 text-xs text-muted-foreground text-center">
          {firmName}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-12 items-center gap-3 border-b bg-background px-4">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon-sm" className="lg:hidden" />}>
              <MenuIcon />
              <span className="sr-only">Menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-0">
              <SheetHeader className="p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
              </SheetHeader>
              <SidebarLogo />
              <Separator />
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Breadcrumb */}
          <div className="flex-1">
            <Breadcrumb />
          </div>

          {/* Language toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="gap-1.5"
          >
            <GlobeIcon className="size-3.5" />
            {lang === "en" ? "हिं" : "EN"}
          </Button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <Avatar size="sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{userName}</span>
                    <span className="text-xs text-muted-foreground font-normal">{firmName}</span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOutIcon />
                {t.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
