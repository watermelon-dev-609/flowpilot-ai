"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  CheckCheck,
  ClipboardList,
  CalendarDays,
  FileSearch,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Network,
  Package,
  Search,
  SearchCheck,
  Send,
  ShieldCheck,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

const navigationGroups: Array<{
  group: string;
  items: Array<{ href: string; label: string; icon: LucideIcon }>;
}> = [
  {
    group: "概览",
    items: [{ href: "/", label: "首页工作台", icon: LayoutDashboard }]
  },
  {
    group: "规则",
    items: [{ href: "/rules", label: "规则中心", icon: ShieldCheck }]
  },
  {
    group: "产品",
    items: [{ href: "/products", label: "产品中心", icon: Package }]
  },
  {
    group: "研究",
    items: [
      { href: "/geo-research", label: "生成式优化研究", icon: Network },
      { href: "/citation-readiness", label: "引用准备度", icon: Search }
    ]
  },
  {
    group: "内容",
    items: [
      { href: "/content-adaptation", label: "内容适配", icon: FileText },
      { href: "/content-calendar", label: "内容日历", icon: CalendarDays },
      { href: "/publish-queue", label: "发布准备", icon: Send }
    ]
  },
  {
    group: "监测",
    items: [
      { href: "/geo-monitor", label: "监测总览", icon: SearchCheck },
      { href: "/geo-monitor/sessions", label: "监测任务", icon: ClipboardList },
      { href: "/geo-monitor/records", label: "监测记录", icon: FileSearch },
      { href: "/geo-monitor/review", label: "证据复核", icon: CheckCheck },
      { href: "/geo-monitor/report", label: "监测报表", icon: BarChart3 }
    ]
  }
];

export function StateCard({
  icon: Icon,
  title,
  description
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-white p-5">
      <Icon aria-hidden="true" className="h-5 w-5 text-emerald-400" />
      <p className="mt-3 font-semibold text-slate-50">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

export function ProLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f0f2f5] text-slate-50">
      <GlobalNavigation collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceHeader
          collapsed={collapsed}
          onOpenMobileNavigation={() => setMobileNavigationOpen(true)}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />
        {children}
      </div>
      {mobileNavigationOpen ? <MobileNavigationDrawer onClose={() => setMobileNavigationOpen(false)} /> : null}
    </div>
  );
}

export function PageShell({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <ProLayout>
      <main className="flex flex-col gap-4 p-5">
        <section className="fp-card px-6 pt-5">
          <p className="text-xs leading-5 text-slate-400">{eyebrow}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-50">{title}</h1>
          <p className="mt-2 max-w-4xl pb-5 text-sm leading-6 text-slate-400">{description}</p>
        </section>
        {children}
      </main>
    </ProLayout>
  );
}

export function WorkspaceHeader({
  collapsed,
  onOpenMobileNavigation,
  onToggleCollapse
}: {
  collapsed: boolean;
  onOpenMobileNavigation: () => void;
  onToggleCollapse: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-slate-800 bg-white px-6">
      <button
        aria-label="打开移动导航"
        className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-950 hover:text-emerald-400 lg:hidden"
        onClick={onOpenMobileNavigation}
        type="button"
      >
        <Menu aria-hidden="true" className="h-4 w-4" />
      </button>
      <button
        aria-label={collapsed ? "展开侧边导航" : "折叠侧边导航"}
        className="hidden h-8 w-8 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-950 hover:text-emerald-400 lg:grid"
        onClick={onToggleCollapse}
        type="button"
      >
        <Menu aria-hidden="true" className="h-4 w-4" />
      </button>

      <div className="ml-auto flex items-center gap-1">
        <IconAction label="搜索" icon={Search} />
        <IconAction label="帮助" icon={HelpCircle} />
        <IconAction label="通知" icon={Bell} />
        <span className="ml-3 grid h-7 w-7 place-items-center rounded-full bg-emerald-400 text-xs font-semibold text-slate-950">
          舟
        </span>
      </div>
    </header>
  );
}

function MobileNavigationDrawer({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/55 lg:hidden">
      <nav
        aria-label="移动端导航"
        aria-modal="true"
        className="flex h-full w-80 max-w-[86vw] flex-col bg-[#001529] shadow-2xl"
        role="dialog"
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-emerald-400 text-sm font-bold text-slate-950">
              舟
            </span>
            <span className="truncate text-[15px] font-semibold text-white">智能运营台</span>
          </div>
          <button
            aria-label="关闭移动导航"
            className="grid h-8 w-8 place-items-center rounded-md text-white/65 transition-colors hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-0.5 overflow-y-auto p-2">
          {navigationGroups.map((section) => (
            <div key={section.group} className="flex flex-col">
              <p className="px-3 pb-1.5 pt-3 text-xs text-white/35">{section.group}</p>
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                      active ? "bg-emerald-400 font-medium text-slate-950" : "text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                    href={item.href}
                    key={item.href}
                    onClick={onClose}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}

function IconAction({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <button
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-950 hover:text-emerald-400"
      type="button"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}

export function GlobalNavigation({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="全局导航"
      className={`hidden shrink-0 flex-col bg-[#001529] transition-[width] duration-200 lg:flex ${collapsed ? "w-16" : "w-52"}`}
    >
      <div className={`flex h-14 items-center gap-2.5 ${collapsed ? "justify-center" : "px-4"}`}>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-emerald-400 text-sm font-bold text-slate-950">
          舟
        </span>
        {collapsed ? null : <span className="truncate text-[15px] font-semibold text-white">智能运营台</span>}
      </div>
      <div className="flex flex-col gap-0.5 overflow-y-auto p-2">
        {navigationGroups.map((section) => (
          <div key={section.group} className="flex flex-col">
            {collapsed ? (
              <div className="mx-3 my-2 h-px bg-white/10" />
            ) : (
              <p className="px-3 pb-1.5 pt-3 text-xs text-white/35">{section.group}</p>
            )}
            {section.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${active ? "bg-emerald-400 font-medium text-slate-950" : "text-white/65 hover:bg-white/10 hover:text-white"}`}
                  href={item.href}
                  key={item.href}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
