import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { compareFiles, getPolicies } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import {
  Upload, GitCompare, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Minus, Plus, Trash2, Info,
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { CompareResult, Dependency, LicenseChange, RiskChange } from '../types';
import { riskBg, formatTimestamp } from '../lib/utils';
import { cn } from '../lib/utils';

function FileDropZone({
  label, file, onFile,
}: { label: string; file: File | null; onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
        file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => ref.current?.click()}
    >
      <input
        ref={ref}
        type="file"
        className="hidden"
        accept=".json,.txt,.lock"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      {file ? (
        <div className="flex items-center justify-center gap-2 text-blue-700">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium text-sm">{file.name}</span>
        </div>
      ) : (
        <>
          <Upload className="w-7 h-7 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-400 mt-1">package.json · package-lock.json · requirements.txt</p>
        </>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count, positive }: {
  icon: React.ElementType; title: string; count: number; positive?: boolean;
}) {
  if (count === 0) return null;
  return (
    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
      <Icon className={cn('w-4 h-4', positive ? 'text-green-500' : 'text-red-500')} />
      {title}
      <span className={cn(
        'text-xs px-1.5 py-0.5 rounded-full',
        positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      )}>
        {count}
      </span>
    </h3>
  );
}

function DepRow({ dep, variant }: { dep: Dependency; variant: 'added' | 'removed' }) {
  return (
    <div className={cn(
      'flex items-start justify-between gap-3 p-3 rounded-lg border text-sm',
      variant === 'added' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
    )}>
      <div>
        <p className="font-medium text-gray-900">{dep.name} <span className="text-gray-500 font-normal">v{dep.version}</span></p>
        <p className="text-xs text-gray-500 mt-0.5">{dep.license} · {dep.direct ? 'Direct' : 'Transitive'}</p>
        {dep.riskReasons?.[0] && (
          <p className="text-xs text-orange-700 mt-1 flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />{dep.riskReasons[0]}
          </p>
        )}
      </div>
      <RiskBadge level={dep.riskLevel} />
    </div>
  );
}

function LicenseChangeRow({ change }: { change: LicenseChange }) {
  const worse = change.newRisk === 'critical' || change.newRisk === 'high';
  return (
    <div className={cn(
      'p-3 rounded-lg border text-sm',
      worse ? 'border-orange-200 bg-orange-50' : 'border-blue-100 bg-blue-50'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-gray-900">{change.name} <span className="text-gray-500 font-normal">v{change.version}</span></p>
          <p className="text-xs text-gray-600 mt-0.5">
            <span className="line-through text-gray-400">{change.oldLicense}</span>
            {' → '}
            <span className="font-semibold">{change.newLicense}</span>
          </p>
          {change.riskReasons?.[0] && (
            <p className="text-xs text-orange-700 mt-1 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />{change.riskReasons[0]}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <RiskBadge level={change.oldRisk} />
          <span className="text-gray-400 text-xs">→</span>
          <RiskBadge level={change.newRisk} />
        </div>
      </div>
    </div>
  );
}

function RiskChangeRow({ change, direction }: { change: RiskChange; direction: 'up' | 'down' }) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-3 p-3 rounded-lg border text-sm',
      direction === 'up' ? 'border-orange-200 bg-orange-50' : 'border-green-100 bg-green-50'
    )}>
      <div>
        <p className="font-medium text-gray-900">{change.name} <span className="text-gray-500 font-normal">v{change.version}</span></p>
        <p className="text-xs text-gray-500 mt-0.5">{change.license}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <RiskBadge level={change.oldRisk} />
        <span className="text-gray-400 text-xs">→</span>
        <RiskBadge level={change.newRisk} />
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [projectName, setProjectName] = useState('');
  const [policyId, setPolicyId] = useState('enterprise-safe');

  const { data: policies } = useQuery({ queryKey: ['policies'], queryFn: getPolicies });

  const mutation = useMutation({
    mutationFn: () => compareFiles(file1!, file2!, projectName || 'comparison', policyId),
  });

  const result = mutation.data;

  const directionIcon = result
    ? result.riskDirection === 'increased'
      ? TrendingUp
      : result.riskDirection === 'decreased'
      ? TrendingDown
      : Minus
    : null;

  const directionColor = result
    ? result.riskDirection === 'increased'
      ? 'text-red-600'
      : result.riskDirection === 'decreased'
      ? 'text-green-600'
      : 'text-gray-500'
    : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dependency Change Impact Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">
          Compare two versions of a dependency manifest to see how licenses and risk have changed.
        </p>
      </div>

      {/* Upload form */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileDropZone label="Baseline (old version)" file={file1} onFile={setFile1} />
          <FileDropZone label="Current (new version)" file={file2} onFile={setFile2} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project name (optional)</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-project"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Policy</label>
            <select
              value={policyId}
              onChange={(e) => setPolicyId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {policies?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          disabled={!file1 || !file2 || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />Comparing…</>
          ) : (
            <><GitCompare className="w-4 h-4" />Compare</>
          )}
        </button>

        {mutation.isError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            {(mutation.error as Error)?.message ?? 'Comparison failed'}
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Overview */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{result.projectName}</h2>
                <p className="text-xs text-gray-400">{formatTimestamp(result.timestamp)}</p>
              </div>
              {directionIcon && (
                <div className={cn('flex items-center gap-1.5 font-semibold text-sm', directionColor)}>
                  {(() => { const DI = directionIcon; return <DI className="w-5 h-5" />; })()}
                  Overall risk {result.riskDirection}
                </div>
              )}
            </div>

            {/* Before / After */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Baseline', snap: result.baseline },
                { label: 'Current', snap: result.current },
              ].map(({ label, snap }) => (
                <div key={label} className={cn('rounded-xl border p-4', riskBg(snap.overallRisk))}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label} · {snap.filename}</p>
                  <div className="flex items-center gap-2 mb-1">
                    <RiskBadge level={snap.overallRisk} />
                    <span className="text-sm text-gray-700">{snap.ecosystem}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {snap.totalDependencies} deps ({snap.directDependencies} direct, {snap.transitiveDependencies} transitive)
                  </p>
                </div>
              ))}
            </div>

            {/* Summary counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Added', value: result.summary.added, icon: Plus, bad: true },
                { label: 'Removed', value: result.summary.removed, icon: Trash2, bad: false },
                { label: 'License changed', value: result.summary.licenseChanged, icon: AlertTriangle, bad: true },
                { label: 'New violations', value: result.summary.newViolations, icon: AlertTriangle, bad: true },
              ].map(({ label, value, icon: Icon, bad }) => (
                <div key={label} className={cn(
                  'rounded-xl border p-3 text-center',
                  value > 0 && bad ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'
                )}>
                  <Icon className={cn('w-4 h-4 mx-auto mb-1', value > 0 && bad ? 'text-red-500' : 'text-gray-400')} />
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Added deps */}
          {result.added.length > 0 && (
            <div className="card space-y-3">
              <SectionHeader icon={Plus} title="Added Dependencies" count={result.added.length} positive={false} />
              {result.added.map((dep) => <DepRow key={dep.name} dep={dep} variant="added" />)}
            </div>
          )}

          {/* Removed deps */}
          {result.removed.length > 0 && (
            <div className="card space-y-3">
              <SectionHeader icon={Trash2} title="Removed Dependencies" count={result.removed.length} positive={true} />
              {result.removed.map((dep) => <DepRow key={dep.name} dep={dep} variant="removed" />)}
            </div>
          )}

          {/* License changes */}
          {result.licenseChanged.length > 0 && (
            <div className="card space-y-3">
              <SectionHeader icon={AlertTriangle} title="License Changes" count={result.licenseChanged.length} positive={false} />
              {result.licenseChanged.map((c) => <LicenseChangeRow key={c.name} change={c} />)}
            </div>
          )}

          {/* Risk increased */}
          {result.riskIncreased.length > 0 && (
            <div className="card space-y-3">
              <SectionHeader icon={TrendingUp} title="Risk Increased" count={result.riskIncreased.length} positive={false} />
              {result.riskIncreased.map((c) => <RiskChangeRow key={c.name} change={c} direction="up" />)}
            </div>
          )}

          {/* Risk decreased */}
          {result.riskDecreased.length > 0 && (
            <div className="card space-y-3">
              <SectionHeader icon={TrendingDown} title="Risk Decreased" count={result.riskDecreased.length} positive={true} />
              {result.riskDecreased.map((c) => <RiskChangeRow key={c.name} change={c} direction="down" />)}
            </div>
          )}

          {/* New conflicts */}
          {result.newConflicts.length > 0 && (
            <div className="card space-y-3">
              <SectionHeader icon={AlertTriangle} title="New License Conflicts" count={result.newConflicts.length} positive={false} />
              {result.newConflicts.map((c, i) => (
                <div key={i} className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm">
                  <p className="font-medium text-gray-900">{c.dep1} ({c.license1}) + {c.dep2} ({c.license2})</p>
                  <p className="text-xs text-gray-600 mt-1">{c.reason}</p>
                </div>
              ))}
            </div>
          )}

          {/* Resolved conflicts */}
          {result.resolvedConflicts.length > 0 && (
            <div className="card space-y-3">
              <SectionHeader icon={CheckCircle} title="Resolved Conflicts" count={result.resolvedConflicts.length} positive={true} />
              {result.resolvedConflicts.map((c, i) => (
                <div key={i} className="p-3 rounded-lg border border-green-200 bg-green-50 text-sm">
                  <p className="font-medium text-gray-900">{c.dep1} + {c.dep2}</p>
                  <p className="text-xs text-gray-500 mt-1">Previously incompatible ({c.license1} / {c.license2}) — no longer in project</p>
                </div>
              ))}
            </div>
          )}

          {/* New violations */}
          {result.newViolations.length > 0 && (
            <div className="card space-y-3">
              <SectionHeader icon={AlertTriangle} title="New Policy Violations" count={result.newViolations.length} positive={false} />
              {result.newViolations.map((v, i) => (
                <div key={i} className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm">
                  <p className="font-medium text-gray-900">{v.dependencyName} <span className="font-normal text-gray-500">({v.license})</span></p>
                  <p className="text-xs text-gray-600 mt-1">{v.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Resolved violations */}
          {result.resolvedViolations.length > 0 && (
            <div className="card space-y-3">
              <SectionHeader icon={CheckCircle} title="Resolved Policy Violations" count={result.resolvedViolations.length} positive={true} />
              {result.resolvedViolations.map((v, i) => (
                <div key={i} className="p-3 rounded-lg border border-green-200 bg-green-50 text-sm">
                  <p className="font-medium text-gray-900">{v.dependencyName} — violation resolved</p>
                  <p className="text-xs text-gray-500 mt-1">{v.rule.name}</p>
                </div>
              ))}
            </div>
          )}

          {/* No changes */}
          {result.summary.added === 0 &&
            result.summary.removed === 0 &&
            result.summary.licenseChanged === 0 &&
            result.summary.newConflicts === 0 &&
            result.summary.newViolations === 0 && (
            <div className="card text-center py-10">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-800">No significant changes detected</p>
              <p className="text-sm text-gray-500 mt-1">License risk and policy compliance are unchanged between these two versions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
