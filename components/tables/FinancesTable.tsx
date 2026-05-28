"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EditModal from "@/components/EditModal";
import { updateFinance } from "@/app/finances/actions";

type CoordinatorOption = { id: string; name: string };

type Finance = {
  id: string;
  name: string | null;
  payment_date: string | null;
  amount: number | null;
  coordinator_id: string | null;
  coordinator?: { id: string; name: string } | null;
};

type FormState = {
  name: string;
  payment_date: string;
  amount: string;
  coordinator_id: string;
};

interface Props {
  finances: Finance[];
  coordinators: CoordinatorOption[];
}

function toForm(f: Finance): FormState {
  return {
    name: f.name ?? "",
    payment_date: f.payment_date?.slice(0, 10) ?? "",
    amount: f.amount?.toString() ?? "",
    coordinator_id: f.coordinator_id ?? "",
  };
}

export default function FinancesTable({ finances, coordinators }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Finance | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  function openEdit(finance: Finance) {
    setEditing(finance);
    setForm(toForm(finance));
  }

  function closeEdit() {
    setEditing(null);
    setForm(null);
  }

  function set(field: keyof FormState, value: string) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function handleSave() {
    if (!editing || !form) return;
    startTransition(async () => {
      await updateFinance(editing.id, {
        name: form.name || null,
        payment_date: form.payment_date || null,
        amount: form.amount ? Number(form.amount) : null,
        coordinator_id: form.coordinator_id || null,
      });
      closeEdit();
      router.refresh();
    });
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-700">
            כל התשלומים ({finances.length})
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">שם</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">משפיע</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">תאריך תשלום</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">סכום</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {finances.length > 0 ? (
              finances.map((finance) => {
                const coordinator = finance.coordinator as { id: string; name: string } | null;
                return (
                  <tr
                    key={finance.id}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => openEdit(finance)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {finance.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600" onClick={(e) => e.stopPropagation()}>
                      {coordinator ? (
                        <Link
                          href={`/coordinators/${coordinator.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {coordinator.name}
                        </Link>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {finance.payment_date
                        ? new Date(finance.payment_date).toLocaleDateString("he-IL")
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#1e3a5f]">
                        ₪{finance.amount?.toLocaleString() ?? 0}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-gray-400">
                  אין תשלומים במערכת
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && form && (
        <EditModal
          title="עריכת תשלום"
          onClose={closeEdit}
          onSave={handleSave}
          isSaving={isPending}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">שם</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">תאריך תשלום</label>
              <input
                type="date"
                value={form.payment_date}
                onChange={(e) => set("payment_date", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">סכום (₪)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">משפיע</label>
              <select
                value={form.coordinator_id}
                onChange={(e) => set("coordinator_id", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">ללא משפיע</option>
                {coordinators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </EditModal>
      )}
    </>
  );
}
