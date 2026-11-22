import { useState } from 'react';
import { Dependency } from '../types';
import RiskBadge from './RiskBadge';
import { ChevronDown, ChevronRight, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  dependencies: Dependency[];
}

export default function DependencyTable({ dependencies }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'direct' | 'transitive'>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = dependencies.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'direct' && !d.direct) return false;
    if (filter === 'transitive' && d.direct) return false;
    if (riskFilter !== 'all' && d.riskLevel !== riskFilter) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search dependencies…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none
            focus:ring-2 focus:ring-blue-500 w-48"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All deps</option>
          <option value="direct">Direct only</option>
          <option value="transitive">Transitive only</option>
        </select>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All risks</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} dependencies</span>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-8"></th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Package</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Version</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">License</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((dep) => (
              <>
                <tr
                  key={dep.name}
                  onClick={() => setExpanded(expanded === dep.name ? null : dep.name)}
                  className={cn(
                    'cursor-pointer hover:bg-gray-50 transition-colors',
                    dep.riskLevel === 'critical' && 'bg-red-50/40',
                    dep.riskLevel === 'high' && 'bg-orange-50/30'
                  )}
                >
                  <td className="px-4 py-3 text-gray-400">
                    {dep.riskReasons.length > 0 || dep.policyViolations.length > 0 ? (
                      expanded === dep.name
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{dep.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{dep.version}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {dep.license}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      dep.direct
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {dep.direct ? 'Direct' : 'Transitive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={dep.riskLevel} />
                  </td>
                </tr>

                {expanded === dep.name && (
                  <tr key={`${dep.name}-detail`}>
                    <td colSpan={6} className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="space-y-2 pl-4">
                        <p className="text-xs font-semibold text-gray-700">
                          {dep.licenseInfo.name}
                          {dep.licenseInfo.url && (
                            <a
                              href={dep.licenseInfo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:underline inline-flex items-center gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </p>

                        {dep.riskReasons.length > 0 && (
                          <div className="space-y-1">
                            {dep.riskReasons.map((reason, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-xs text-orange-700">
                                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-orange-500" />
                                {reason}
                              </div>
                            ))}
                          </div>
                        )}

                        {dep.policyViolations.length > 0 && (
                          <div className="space-y-1">
                            {dep.policyViolations.map((v, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-red-500" />
                                {v}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            Copyleft: <strong className={dep.licenseInfo.copyleft ? 'text-orange-600' : 'text-green-600'}>
                              {dep.licenseInfo.copyleft ? 'Yes' : 'No'}
                            </strong>
                          </span>
                          <span>Category: <strong>{dep.licenseInfo.category}</strong></span>
                          {dep.licenseInfo.conditions.length > 0 && (
                            <span>Conditions: {dep.licenseInfo.conditions.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No dependencies match your filters</div>
        )}
      </div>
    </div>
  );
}
