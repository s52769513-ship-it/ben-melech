"use client";

import { useSettings } from "@/lib/settings-context";

type Coordinator = { id: string; name: string };

export default function CoordinatorSelect({
  coordinators,
  defaultValue,
}: {
  coordinators: Coordinator[];
  defaultValue?: string;
}) {
  const { settings } = useSettings();
  const visible = coordinators.filter((c) => !settings.hiddenCoordinators.includes(c.id));

  return (
    <select
      name="coordinator"
      defaultValue={defaultValue ?? ""}
      className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      <option value="">כל המשפיעים</option>
      {visible.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
