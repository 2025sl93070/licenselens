import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAnalysis, getExportCsvUrl } from '../lib/api';
import {
  AlertTriangle, CheckCircle, Package, Shield,
  ArrowLeft, Info, ExternalLink, Download
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import RiskSummaryChart from '../components/RiskSummaryChart';
import DependencyTable from '../components/DependencyTable';
import ConflictPanel from '../components/ConflictPanel';
import PolicyPanel from '../components/PolicyPanel';
import DependencyGraph from '../components/DependencyGraph';
import { riskBg, formatTimestamp } from '../lib/utils';

type TabId = 'overview' | 'dependencies' | 'conflicts' | 'policy' | 'graph';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'conflicts', label: 'Conflicts' },
  { id: 'policy', label: 'Policy' },
  { id: 'graph', label: 'Dependency Graph' },
];

import { useState } from 'react';
import { cn } from '../lib/utils';

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => getAnalysis(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center space-y-2">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm">Analyzing dependencies…</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="card text-center text-red-600 py-12">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-60" />
        <p>Analysis not found or an error occurred.</p>
        <Link to="/" className="btn-secondary mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{result.projectName}</h1>
            <RiskBadge level={result.overallRisk} />
          </div>
          <p className="text-sm text-gray-500">
            Ecosystem: <strong>{result.ecosystem}</strong> ·{' '}
            {formatTimestamp(result.timestamp)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={getExportCsvUrl(result.id)}
            download
            className="btn-secondary text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Overall risk explanation */}
      <div className={cn('border rounded-xl p-4 flex items-start gap-3', riskBg(result.overallRisk))}>
        {result.overallRisk === 'low' ? (
          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        )}
        <div>
          <p className="font-semibold text-sm">
            Overall Risk: {result.overallRisk.charAt(0).toUpperCase() + result.overallRisk.slice(1)}
          </p>
          <p className="text-sm mt-0.5">{result.overallRiskExplanation}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Deps', value: result.totalDependencies, icon: Package },
          { label: 'Direct', value: result.directDependencies, icon: Package },
          { label: 'Transitive', value: result.transitiveDependencies, icon: Package },
          { label: 'Conflicts', value: result.conflicts.length, icon: AlertTriangle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card py-4 text-center">
            <Icon className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
              {tab.id === 'conflicts' && result.conflicts.length > 0 && (
                <span className="ml-1.5 bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full">
                  {result.conflicts.length}
                </span>
              )}
              {tab.id === 'policy' && result.policyViolations.length > 0 && (
                <span className="ml-1.5 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">
                  {result.policyViolations.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="card mt-4">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="section-title">Risk & License Summary</h2>
              <RiskSummaryChart result={result} />

              {result.topRisks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Top Risk Dependencies
                  </h3>
                  <div className="space-y-2">
                    {result.topRisks.map((dep) => (
                      <div
                        key={dep.name}
                        className="flex items-start justify-between gap-3 border border-gray-100 rounded-lg p-3"
                      >
                        <div>
                          <p className="font-medium text-sm">{dep.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {dep.license} · {dep.direct ? 'Direct' : 'Transitive'}
                          </p>
                          {dep.riskReasons.length > 0 && (
                            <p className="text-xs text-orange-700 mt-1 flex items-start gap-1">
                              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {dep.riskReasons[0]}
                            </p>
                          )}
                        </div>
                        <RiskBadge level={dep.riskLevel} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dependencies' && (
            <div>
              <h2 className="section-title">All Dependencies</h2>
              <DependencyTable dependencies={result.dependencies} />
            </div>
          )}

          {activeTab === 'conflicts' && (
            <div>
              <h2 className="section-title">License Conflicts</h2>
              <p className="text-sm text-gray-500 mb-4">
                These dependency pairs use licenses that are legally incompatible and cannot be distributed together.
              </p>
              <ConflictPanel conflicts={result.conflicts} />
            </div>
          )}

          {activeTab === 'policy' && (
            <div>
              <h2 className="section-title">Policy Violations</h2>
              <p className="text-sm text-gray-500 mb-4">
                Dependencies that violate the applied license policy rules.
              </p>
              <PolicyPanel violations={result.policyViolations} />
            </div>
          )}

          {activeTab === 'graph' && (
            <div>
              <h2 className="section-title">Dependency Graph</h2>
              <p className="text-sm text-gray-500 mb-4">
                Visual map of direct and transitive dependencies, color-coded by risk level. Showing up to 30 packages.
              </p>
              <DependencyGraph dependencies={result.dependencies} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
