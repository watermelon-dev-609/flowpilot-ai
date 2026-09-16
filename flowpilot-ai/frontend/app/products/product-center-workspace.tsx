"use client";

import { PackagePlus, SearchCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const storageKey = "flowpilot.products";

type ProductAsset = {
  id: string;
  productName: string;
  brandName: string;
  targetUrl: string;
  targetAudience: string;
  sellingPoints: string;
  facts: string;
  createdAt: string;
};

type ProductFormState = Omit<ProductAsset, "id" | "createdAt">;

const emptyProductForm: ProductFormState = {
  productName: "",
  brandName: "",
  targetUrl: "",
  targetAudience: "",
  sellingPoints: "",
  facts: ""
};

export function ProductCenterWorkspace() {
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [products, setProducts] = useState<ProductAsset[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setProducts(readStoredProducts());
  }, []);

  const latestProduct = products[0];
  const completion = useMemo(() => calculateProductCompletion(latestProduct), [latestProduct]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.productName.trim() || !form.brandName.trim() || !form.targetUrl.trim()) {
      setError("请填写产品名称、品牌名称和目标页面链接");
      return;
    }

    const product: ProductAsset = {
      ...form,
      id: `product-${Date.now()}`,
      productName: form.productName.trim(),
      brandName: form.brandName.trim(),
      targetUrl: form.targetUrl.trim(),
      targetAudience: form.targetAudience.trim(),
      sellingPoints: form.sellingPoints.trim(),
      facts: form.facts.trim(),
      createdAt: new Date().toISOString()
    };

    setProducts((current) => {
      const next = [product, ...current];
      persistProducts(next);
      return next;
    });
    setForm(emptyProductForm);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.4fr]">
      <section className="fp-card p-6">
        <div className="flex items-center gap-3">
          <PackagePlus aria-hidden="true" className="h-5 w-5 text-emerald-300" />
          <div>
            <p className="text-sm text-emerald-300">产品资料录入</p>
            <h2 className="text-base font-semibold text-slate-50">建立产品资产</h2>
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-md border border-rose-400/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        ) : null}

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <TextInput label="产品名称" value={form.productName} onChange={(productName) => setForm((current) => ({ ...current, productName }))} />
          <TextInput label="品牌名称" value={form.brandName} onChange={(brandName) => setForm((current) => ({ ...current, brandName }))} />
          <TextInput label="目标页面链接" value={form.targetUrl} onChange={(targetUrl) => setForm((current) => ({ ...current, targetUrl }))} />
          <TextInput label="目标客户" value={form.targetAudience} onChange={(targetAudience) => setForm((current) => ({ ...current, targetAudience }))} />
          <TextArea label="核心卖点" value={form.sellingPoints} onChange={(sellingPoints) => setForm((current) => ({ ...current, sellingPoints }))} />
          <TextArea label="事实依据" value={form.facts} onChange={(facts) => setForm((current) => ({ ...current, facts }))} />
          <button className="cursor-pointer rounded-md bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300">
            保存产品资料
          </button>
        </form>
      </section>

      <section aria-label="产品资产列表" className="fp-card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-emerald-300">产品资产列表</p>
            <h2 className="mt-1 text-base font-semibold text-slate-50">产品理解主线起点</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              产品资料先沉淀为可复用资产，再进入研究选题、内容适配、发布准备和 GEO 监测，避免后续页面反复手动输入基础信息。
            </p>
          </div>
          <Link
            className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-400/10"
            href="/geo-research"
          >
            <SearchCheck aria-hidden="true" className="h-4 w-4" />
            进入生成式优化研究
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ProductMetric label="产品资产" value={`${products.length} 个`} />
          <ProductMetric label="资料完整度" value={`${completion}%`} />
          <ProductMetric label="下一步" value="产品理解 / GEO 研究" />
        </div>

        <div className="mt-5 space-y-3">
          {products.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
              暂无产品资产。先录入一个真实产品，后续才能形成产品卡片、事实核查和内容生成链路。
            </div>
          ) : (
            products.map((product) => (
              <article key={product.id} className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{product.brandName}</p>
                    <h3 className="mt-1 text-base font-semibold text-slate-50">{product.productName}</h3>
                    <p className="mt-2 break-all text-sm text-slate-400">{product.targetUrl}</p>
                    {product.sellingPoints ? <p className="mt-3 text-sm leading-6 text-slate-300">{product.sellingPoints}</p> : null}
                  </div>
                  <Link
                    className="inline-flex w-fit rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300"
                    href={buildGeoResearchHref(product)}
                  >
                    带入 GEO 研究
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm text-slate-300">
      {label}
      <input
        className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm text-slate-300">
      {label}
      <textarea
        className="mt-2 min-h-20 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ProductMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/80 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function buildGeoResearchHref(product: ProductAsset) {
  const params = new URLSearchParams({
    product: product.productName,
    brand: product.brandName,
    url: product.targetUrl
  });
  if (product.targetAudience) params.set("audience", product.targetAudience);
  if (product.facts) params.set("facts", product.facts);
  return `/geo-research?${params.toString()}`;
}

function calculateProductCompletion(product?: ProductAsset) {
  if (!product) return 0;
  const fields = [product.productName, product.brandName, product.targetUrl, product.targetAudience, product.sellingPoints, product.facts];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function readStoredProducts() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistProducts(products: ProductAsset[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(products));
}
