"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, MapPin, ChevronLeft } from "lucide-react";
import EditModal from "@/components/EditModal";
import { updateCoordinator } from "@/app/coordinators/actions";

type Coordinator = {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  id_number: number | null;
  bank: string | null;
  branch_number: number | null;
  account_number: number | null;
  monthly_salary: number;
  notes: string | null;
};

type FormState = {
  name: string;
  phone: string;
  city: string;
  email: string;
  id_number: string;
  bank: string;
  branch_number: string;
  account_number: string;
  monthly_salary: string;
  notes: string;
};

interface Props {
  coordinators: Coordinator[];
  studentCountMap: Record<string, number>;
  inquiryCountMap: Record<string, number>;
}

function toForm(c: Coordinator): FormState {
  return {
    name: c.name ?? "",
    phone: c.phone ?? "",
    city: c.city ?? "",
    email: c.email ?? "",
    id_number: c.id_number?.toString() ?? "",
    bank: c.bank ?? "",
    branch_number: c.branch_number?.toString() ?? "",
    account_number: c.account_number?.toString() ?? "",
    monthly_salary: c.monthly_salary?.toString() ?? "",
    notes: c.notes ?? "",
  };
}

export default function CoordinatorsTable({ coordinators, studentCountMap, inquiryCountMap }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Coordinator | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  function openEdit(coordinator: Coordinator) {
    setEditing(coordinator);
    setForm(toForm(coordinator));
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
      await updateCoordinator(editing.id, {
        name: form.name || null,
        phone: form.phone || null,
        city: form.city || null,
        email: form.email || null,
        id_number: form.id_number ? Number(form.id_number) : null,
        bank: form.bank || null,
        branch_number: form.branch_number ? Number(form.branch_number) : null,
        account_number: form.account_number ? Number(form.account_number) : null,
        monthly_salary: form.monthly_salary ? Number(form.monthly_salary) : 0,
        notes: form.notes || null,
      });
      closeEdit();
      router.refresh();
    });
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">שם</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">עיר</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">טלפון</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">אימייל</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">בחורים</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">פניות פתוחות</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coordinators.length > 0 ? (
              coordinators.map((coordinator) => (
                <tr
                  key={coordinator.id}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  onClick={() => openEdit(coordinator)}
                >
                  <td className="px-6 py-4 font-medium text-gray-900">{coordinator.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {coordinator.city ? (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-gray-400" />
                        {coordinator.city}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {coordinator.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone size={13} className="text-gray-400" />
                        {coordinator.phone}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {coordinator.email ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-full">
                      {studentCountMap[coordinator.id] ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(inquiryCountMap[coordinator.id] ?? 0) > 0 ? (
                      <span className="bg-orange-50 text-orange-700 font-semibold text-xs px-2.5 py-1 rounded-full">
                        {inquiryCountMap[coordinator.id]}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/coordinators/${coordinator.id}`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs"
                    >
                      פרופיל
                      <ChevronLeft size={14} />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  אין משפיעים במערכת
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && form && (
        <EditModal
          title={`עריכת ${editing.name}`}
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
              <label className="text-xs font-medium text-gray-500">טלפון</label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">עיר</label>
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">אימייל</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">ת.ז</label>
              <input
                type="number"
                value={form.id_number}
                onChange={(e) => set("id_number", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">משכורת חודשית (₪)</label>
              <input
                type="number"
                value={form.monthly_salary}
                onChange={(e) => set("monthly_salary", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="col-span-2 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 mb-3">פרטי בנק</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">בנק</label>
                  <input
                    value={form.bank}
                    onChange={(e) => set("bank", e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">סניף</label>
                  <input
                    type="number"
                    value={form.branch_number}
                    onChange={(e) => set("branch_number", e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">חשבון</label>
                  <input
                    type="number"
                    value={form.account_number}
                    onChange={(e) => set("account_number", e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-gray-500">הערות</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>
          </div>
        </EditModal>
      )}
    </>
  );
}
