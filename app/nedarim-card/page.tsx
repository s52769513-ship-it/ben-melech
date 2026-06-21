import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { getSession } from "@/lib/auth";
import NedarimCardClient from "./NedarimCardClient";

export default async function NedarimCardPage() {
  const session = await getSession();
  if (session !== "ADMIN") redirect("/");

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 print:hidden">
        <CreditCard size={22} className="text-[#1e3a5f]" />
        <h1 className="text-xl font-bold text-[#1e3a5f]">נדרים קארד</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <NedarimCardClient />
      </div>
    </div>
  );
}
