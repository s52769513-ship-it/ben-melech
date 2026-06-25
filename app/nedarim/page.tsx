import { CreditCard } from "lucide-react";
import NedarimPanel from "@/components/NedarimPanel";
import { getStudentsForNedarim } from "@/lib/db";
import { getSession } from "@/lib/auth";

export default async function NedarimPage() {
  const coordinatorId = await getSession();
  const isAdmin = coordinatorId === "ADMIN";
  const loggedIn = isAdmin ? null : coordinatorId;

  const students = await getStudentsForNedarim(loggedIn ?? undefined);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <CreditCard size={28} />
          נדרים
        </h1>
      </div>
      <NedarimPanel students={students} />
    </div>
  );
}
