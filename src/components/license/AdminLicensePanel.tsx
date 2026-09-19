/**
 * NASAQ License — Admin license management panel.
 *
 * Protected by ADMIN_SECRET (server-side verification).
 * Allows creating, viewing, revoking, and reactivating licenses.
 */

import { useState, useCallback, useEffect } from "react";
import {
  adminCreateLicenseFn,
  adminListLicensesFn,
  adminRevokeLicenseFn,
  adminReactivateLicenseFn,
} from "@/lib/license/functions";
import type { License, LicenseType } from "@/lib/license/types";
import {
  Shield,
  Plus,
  Copy,
  Check,
  Ban,
  RotateCcw,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

export default function AdminLicensePanel() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<LicenseType>("PRO");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLicenses = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    const result = await adminListLicensesFn({ data: { adminSecret: secret, offset: 0, limit: 100 } });
    if (result.error) {
      setError(String(result.error));
    } else {
      setLicenses(result.licenses as License[]);
      setTotal(result.total);
      setError(null);
    }
    setLoading(false);
  }, [secret]);

  useEffect(() => {
    if (authenticated) loadLicenses();
  }, [authenticated, loadLicenses]);

  const handleAuth = () => {
    if (secret.trim()) {
      setAuthenticated(true);
      setError(null);
    }
  };

  const handleCreate = async () => {
    const result = await adminCreateLicenseFn({
      data: { adminSecret: secret, type: createType },
    });
    if (result.plainKey && typeof result.plainKey === "string") {
      setNewKey(result.plainKey);
      loadLicenses();
    } else if (result.error) {
      setError(String(result.error));
    }
  };

  const handleCopyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = async (id: string) => {
    await adminRevokeLicenseFn({ data: { adminSecret: secret, licenseId: id } });
    loadLicenses();
  };

  const handleReactivate = async (id: string) => {
    await adminReactivateLicenseFn({ data: { adminSecret: secret, licenseId: id } });
    loadLicenses();
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
      case "EXPIRED": return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
      case "REVOKED": return "text-red-600 bg-red-50 dark:bg-red-900/20";
      default: return "text-gray-600 bg-gray-50 dark:bg-gray-800";
    }
  };

  // Auth screen
  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6">
        <div className="flex items-center gap-3">
          <Shield className="size-6 text-emerald-600" />
          <h1 className="text-xl font-bold">إدارة التراخيص</h1>
        </div>
        <div className="rounded-xl border border-line p-6 dark:border-white/10">
          <label className="mb-2 block text-sm font-bold">Admin Secret</label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mb-3 w-full rounded-lg border border-line bg-transparent px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-white/10"
            placeholder="أدخل مفتاح الإدارة"
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          />
          <button
            type="button"
            onClick={handleAuth}
            disabled={!secret.trim()}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            دخول الإدارة
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="size-6 text-emerald-600" />
          <div>
            <h1 className="text-xl font-bold">إدارة التراخيص</h1>
            <p className="text-sm text-muted">{total} ترخيص</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadLicenses}
            className="rounded-lg border border-line p-2 hover:bg-accent dark:border-white/10"
          >
            <RefreshCw className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <Plus className="size-4" />
            إنشاء ترخيص
          </button>
        </div>
      </div>

      {/* New Key Display */}
      {newKey && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              ✅ تم إنشاء الترخيص — انسخ المفتاح الآن (لن يظهر مرة أخرى)
            </p>
            <button type="button" onClick={() => setNewKey(null)} className="text-emerald-600 hover:text-emerald-800">
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-sm font-bold tracking-wider dark:bg-emerald-950" dir="ltr">
              {newKey}
            </code>
            <button
              type="button"
              onClick={handleCopyKey}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-line bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1a2332]">
            <h3 className="mb-4 text-lg font-bold">إنشاء ترخيص جديد</h3>
            <label className="mb-2 block text-sm font-bold">نوع الترخيص</label>
            <select
              value={createType}
              onChange={(e) => setCreateType(e.target.value as LicenseType)}
              className="mb-4 w-full rounded-lg border border-line bg-transparent px-4 py-2.5 text-sm outline-none dark:border-white/10"
            >
              <option value="TRIAL">تجريبي (TRIAL)</option>
              <option value="PRO">احترافي (PRO)</option>
              <option value="LIFETIME">مدى الحياة (LIFETIME)</option>
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
              >
                إنشاء
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-bold hover:bg-accent dark:border-white/10"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Licenses Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted">جارٍ التحميل...</div>
      ) : licenses.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted">لا توجد تراخيص.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line dark:border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-accent/50 dark:border-white/10">
                <th className="px-4 py-3 text-right font-bold">المفتاح</th>
                <th className="px-4 py-3 text-right font-bold">النوع</th>
                <th className="px-4 py-3 text-right font-bold">الحالة</th>
                <th className="px-4 py-3 text-right font-bold">المستخدم</th>
                <th className="px-4 py-3 text-right font-bold">الانتهاء</th>
                <th className="px-4 py-3 text-right font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((lic) => (
                <tr key={lic.id} className="border-b border-line last:border-0 dark:border-white/10">
                  <td className="px-4 py-3 font-mono text-xs font-bold" dir="ltr">
                    {lic.keyPrefix}-****
                  </td>
                  <td className="px-4 py-3 font-bold">{lic.type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${statusColor(lic.status)}`}>
                      {lic.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{lic.userId ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString("ar") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {lic.status === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(lic.id)}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="إلغاء"
                        >
                          <Ban className="size-3.5" />
                        </button>
                      )}
                      {(lic.status === "REVOKED" || lic.status === "EXPIRED") && (
                        <button
                          type="button"
                          onClick={() => handleReactivate(lic.id)}
                          className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          title="إعادة تفعيل"
                        >
                          <RotateCcw className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
