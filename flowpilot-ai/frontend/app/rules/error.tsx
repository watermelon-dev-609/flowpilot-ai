"use client";

import { AlertTriangle } from "lucide-react";

export default function RulesError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto max-w-3xl rounded-lg border border-red-400/30 bg-red-950/30 p-6">
        <AlertTriangle aria-hidden="true" className="h-6 w-6 text-red-300" />
        <h1 className="mt-4 text-2xl font-semibold text-slate-50">规则中心错误状态</h1>
        <p className="mt-3 text-sm leading-6 text-red-100">
          规则来源暂时不可用时，系统只记录失败原因，不生成虚假规则。
        </p>
        <button
          className="mt-5 rounded-md bg-red-200 px-4 py-2 text-sm font-semibold text-red-950 transition-colors duration-200 hover:bg-red-100"
          onClick={reset}
          type="button"
        >
          重新加载规则
        </button>
      </section>
    </main>
  );
}
