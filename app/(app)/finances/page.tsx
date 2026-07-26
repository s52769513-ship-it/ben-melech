import Link from "next/link";
import { Suspense, cache } from "react";
import { Wallet, TrendingUp } from "lucide-react";
import FinancesTable from "@/components/tables/FinancesTable";
import NedarimPanel from "@/components/NedarimPanel";
import { BlockSkeleton, TableSkeleton } from "@/components/Skeletons";
import { getFinances, getFinancesByCoordinator, getCoordinators, getStudentsForNedarim } from "@/lib/airtable/db";
import { getSession } from "@/lib/auth";

export default function FinancesPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <Wallet size={28} />
          כספים
        </h1>
        <Suspense fallback={<p className="text-gray-500 mt-1">טוען…</p>}>
          <FinancesTotal />
        </Suspense>
      </div>

      <div className="mb-8">
        <Suspense fallback={<BlockSkeleton className="h-40" />}>
          <NedarimSection />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <TableSkeleton rows={6} columns={4} />
            </div>
            <BlockSkeleton className="h-80" />
          </div>
        }
      >
        <FinancesContent />
      </Suspense>
    </div>
  );
}

// The header total and the tables below both need the same rows.
const resolveFinances = cache(async () => {
  const coordinatorId = await getSession();
  const isAdmin = coordinatorId === "ADMIN";
  const loggedIn = isAdmin ? null : coordinatorId;
  const finances = loggedIn ? await getFinancesByCoordinator(loggedIn) : await getFinances();

  const coordinatorTotals: Record<string, { name: string; id: string; total: number; count: number }> = {};
  finances.forEach((f) => {
    if (f.coordinator) {
      if (!coordinatorTotals[f.coordinator.id]) {
        coordinatorTotals[f.coordinator.id] = {
          name: f.coordinator.name,
          id: f.coordinator.id,
          total: 0,
          count: 0,
        };
      }
      coordinatorTotals[f.coordinator.id].total += f.amount ?? 0;
      coordinatorTotals[f.coordinator.id].count++;
    }
  });

  const sortedCoordinators = Object.values(coordinatorTotals).sort((a, b) => b.total - a.total);
  const grandTotal = sortedCoordinators.reduce((acc, c) => acc + c.total, 0);

  return { loggedIn, finances, sortedCoordinators, grandTotal };
});

async function FinancesTotal() {
  const { grandTotal } = await resolveFinances();
  return <p className="text-gray-500 mt-1">סה״כ תשלומים: ₪{grandTotal.toLocaleString()}</p>;
}

async function NedarimSection() {
  const coordinatorId = await getSession();
  const loggedIn = coordinatorId === "ADMIN" ? null : coordinatorId;
  const students = await getStudentsForNedarim(loggedIn ?? undefined);
  return <NedarimPanel students={students} />;
}

async function FinancesContent() {
  const { finances, sortedCoordinators, grandTotal } = await resolveFinances();
  const coordinators = await getCoordinators();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        <FinancesTable finances={finances} coordinators={coordinators} />
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-500" />
            <h2 className="font-semibold text-gray-700">סיכום לפי משפיע</h2>
          </div>
          <div className="p-6">
            {sortedCoordinators.length > 0 ? (
              <ul className="space-y-4">
                {sortedCoordinators.map((c) => (
                  <li key={c.id}>
                    <div className="flex justify-between items-start mb-1">
                      <Link
                        href={`/coordinators/${c.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {c.name}
                      </Link>
                      <span className="text-sm font-bold text-[#1e3a5f]">
                        ₪{c.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                      <span>{c.count} תשלומים</span>
                      <span>
                        {grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1e3a5f] rounded-full"
                        style={{
                          width: `${grandTotal > 0 ? (c.total / grandTotal) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">אין נתונים</p>
            )}

            {grandTotal > 0 && (
              <div className="mt-6 pt-5 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-500">סה״כ</span>
                <span className="text-base font-bold text-[#1e3a5f]">
                  ₪{grandTotal.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
