import { PolicyViolation } from '../types';
import { XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  violations: PolicyViolation[];
}

export default function PolicyPanel({ violations }: Props) {
  if (violations.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4" />
        No policy violations detected.
      </div>
    );
  }

  const denies = violations.filter((v) => v.rule.type === 'deny');
  const warns = violations.filter((v) => v.rule.type === 'warn');

  return (
    <div className="space-y-3">
      {denies.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
            Denied ({denies.length})
          </p>
          {denies.map((v, i) => (
            <div key={i} className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-2">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{v.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {warns.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-2">
            Warnings ({warns.length})
          </p>
          {warns.map((v, i) => (
            <div key={i} className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">{v.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
