import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: "blue" | "green" | "orange" | "red" | "purple";
}

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-700",
    value: "text-blue-800",
  },
  green: {
    bg: "bg-green-50",
    icon: "bg-green-100 text-green-700",
    value: "text-green-800",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "bg-orange-100 text-orange-700",
    value: "text-orange-800",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-100 text-red-700",
    value: "text-red-800",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-100 text-purple-700",
    value: "text-purple-800",
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color = "blue",
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={`${colors.bg} rounded-xl border border-gray-200 p-5 flex items-start gap-4`}
    >
      <div className={`${colors.icon} rounded-lg p-3 shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className={`${colors.value} text-2xl font-bold mt-1`}>{value}</p>
        {description && (
          <p className="text-gray-400 text-xs mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
