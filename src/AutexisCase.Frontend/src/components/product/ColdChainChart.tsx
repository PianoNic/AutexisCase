import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface TempLog {
  id?: string
  time?: Date
  temperature?: number
  location?: string
}

export function ColdChainChart({ data, maxTemp }: { data: TempLog[]; maxTemp: number }) {
  const chartData = data.map((d) => ({
    name: d.location ?? '',
    temp: d.temperature ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
        <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} unit="°" />
        <Tooltip
          contentStyle={{ fontSize: 11, borderRadius: 8 }}
          formatter={(value: number) => [`${value}°C`, 'Temperatur']}
        />
        <ReferenceLine y={maxTemp} stroke="#ef4444" strokeDasharray="4 3" label={{ value: `Max ${maxTemp}°C`, fontSize: 9, fill: '#ef4444' }} />
        <Area
          type="monotone"
          dataKey="temp"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#tempGrad)"
          dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
