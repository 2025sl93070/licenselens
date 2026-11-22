import { AnalysisResult } from '../types';
import { riskBarColor } from '../lib/utils';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

interface Props {
  result: AnalysisResult;
}

const RISK_ORDER = ['critical', 'high', 'medium', 'low'] as const;

export default function RiskSummaryChart({ result }: Props) {
  const riskData = RISK_ORDER.filter((r) => result.riskSummary[r] > 0).map((r) => ({
    name: r.charAt(0).toUpperCase() + r.slice(1),
    value: result.riskSummary[r],
    color: riskBarColor(r),
  }));

  const licenseData = Object.entries(result.licenseDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Risk donut */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-3">Risk Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={riskData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {riskData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} deps`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {riskData.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span>{d.name}: {d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* License bar */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-3">License Distribution</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={licenseData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
