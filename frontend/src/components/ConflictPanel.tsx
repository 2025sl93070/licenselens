import { LicenseConflict } from '../types';
import RiskBadge from './RiskBadge';
import { AlertTriangle } from 'lucide-react';

interface Props {
  conflicts: LicenseConflict[];
}

export default function ConflictPanel({ conflicts }: Props) {
  if (conflicts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4" />
        No license conflicts detected.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conflicts.map((c, i) => (
        <div
          key={i}
          className="border border-orange-200 bg-orange-50 rounded-xl p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm bg-white border border-orange-200 px-2 py-0.5 rounded">
                {c.dep1}
              </span>
              <span className="text-xs text-gray-500">({c.license1})</span>
              <span className="text-orange-500 font-bold">⚡</span>
              <span className="font-mono text-sm bg-white border border-orange-200 px-2 py-0.5 rounded">
                {c.dep2}
              </span>
              <span className="text-xs text-gray-500">({c.license2})</span>
            </div>
            <RiskBadge level={c.severity} />
          </div>
          <p className="text-sm text-orange-800">{c.reason}</p>
        </div>
      ))}
    </div>
  );
}
