interface StatCardProps {
    label: string
    value: number | string
    color?: 'blue' | 'red' | 'yellow' | 'green' | 'slate'
  }
  
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    yellow: 'bg-amber-50 text-amber-700 border-amber-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  }
  
  export default function StatCard({ label, value, color = 'slate' }: StatCardProps) {
    return (
      <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
        <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    )
  }