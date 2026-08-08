interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
}

export default function StatCard({ icon, label, value, suffix = "" }: StatCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="text-xl font-bold text-gray-800">
        {value.toLocaleString("tr-TR")}
        {suffix}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}