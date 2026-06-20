"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, RefreshCw, Save, X } from "lucide-react";
import { callCard, isOk, asList } from "./api";

type Store = { StoreId?: string; StoreName?: string; Enabled?: string };
type GroupStore = { StoreId?: string; StoreName?: string };
type Group = { ID?: string; ListName?: string; Stores?: GroupStore[] };

export default function StoreGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Group | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [g, s] = await Promise.all([
      callCard("GetLimitedStoresList"),
      callCard("GetStoresList"),
    ]);
    const groupList = asList<Group>(g);
    if (groupList) setGroups(groupList);
    else if (g.Result === "Error") setError(g.Message || "שגיאה בטעינת קבוצות החנויות");
    else setGroups([]);
    setStores(asList<Store>(s) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flash(ok: boolean, text: string) {
    setNotice({ ok, text });
    setTimeout(() => setNotice(null), 4000);
  }

  async function remove(group: Group) {
    if (!confirm(`למחוק את הקבוצה "${group.ListName}"?`)) return;
    setBusy(`del-${group.ID}`);
    const res = await callCard("SaveLimitedStores", {
      ListId: group.ID,
      ListName: group.ListName,
      Delete: 1,
    });
    setBusy(null);
    if (isOk(res)) {
      flash(true, "הקבוצה נמחקה");
      load();
    } else {
      flash(false, res.Message || "המחיקה נכשלה");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
        <Loader2 size={18} className="animate-spin" /> טוען...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">קבוצות חנויות להגבלת טעינות</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="רענן"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d4f7f]"
          >
            <Plus size={14} /> קבוצה חדשה
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`text-sm px-6 py-2 ${
            notice.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {notice.text}
        </div>
      )}

      {editing && (
        <GroupForm
          group={editing === "new" ? null : editing}
          stores={stores}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          flash={flash}
        />
      )}

      {error ? (
        <p className="text-red-500 text-sm text-center py-8">{error}</p>
      ) : groups.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">אין קבוצות חנויות</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {groups.map((g) => (
            <div key={g.ID} className="px-6 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {g.ListName} <span className="text-xs text-gray-400">#{g.ID}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(g.Stores ?? []).map((s) => s.StoreName).join(", ") || "אין חנויות"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditing(g)}
                  className="text-xs text-blue-600 hover:underline px-2 py-1"
                >
                  עריכה
                </button>
                <button
                  onClick={() => remove(g)}
                  disabled={busy === `del-${g.ID}`}
                  className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                >
                  {busy === `del-${g.ID}` ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupForm({
  group,
  stores,
  onClose,
  onSaved,
  flash,
}: {
  group: Group | null;
  stores: Store[];
  onClose: () => void;
  onSaved: () => void;
  flash: (ok: boolean, text: string) => void;
}) {
  const [name, setName] = useState(group?.ListName ?? "");
  const [selected, setSelected] = useState<string[]>(
    (group?.Stores ?? []).map((s) => s.StoreId ?? "").filter(Boolean)
  );
  const [saving, setSaving] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function save() {
    if (!name.trim()) {
      flash(false, "יש להזין שם קבוצה");
      return;
    }
    if (selected.length === 0) {
      flash(false, "יש לבחור לפחות חנות אחת");
      return;
    }
    setSaving(true);
    const res = await callCard("SaveLimitedStores", {
      ListId: group?.ID,
      ListName: name,
      StoresId: selected.join(","),
    });
    setSaving(false);
    if (isOk(res)) {
      flash(true, group ? "הקבוצה עודכנה" : "הקבוצה נוספה");
      onSaved();
    } else {
      flash(false, res.Message || "השמירה נכשלה");
    }
  }

  return (
    <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#1e3a5f]">
          {group ? `עריכת קבוצה: ${group.ListName}` : "קבוצה חדשה"}
        </p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
          <X size={16} />
        </button>
      </div>
      <label className="block text-sm">
        <span className="text-gray-500 text-xs">שם הקבוצה {group && "(לא ניתן לשינוי)"}</span>
        <input
          type="text"
          value={name}
          disabled={!!group}
          onChange={(e) => setName(e.target.value)}
          className="mt-0.5 w-full md:w-1/2 border border-gray-300 rounded px-2 py-1.5 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </label>
      <div>
        <span className="text-gray-500 text-xs">חנויות בקבוצה</span>
        <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 grid grid-cols-1 md:grid-cols-2 gap-1">
          {stores.length === 0 ? (
            <p className="text-gray-400 text-xs p-2">אין חנויות זמינות</p>
          ) : (
            stores.map((s) => (
              <label key={s.StoreId} className="flex items-center gap-2 text-sm px-1 py-0.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(s.StoreId ?? "")}
                  onChange={() => toggle(s.StoreId ?? "")}
                />
                <span className="text-gray-700">{s.StoreName}</span>
              </label>
            ))
          )}
        </div>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d4f7f] disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        שמור
      </button>
    </div>
  );
}
