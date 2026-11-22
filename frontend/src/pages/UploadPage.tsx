import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Upload, FlaskConical, Shield, AlertTriangle, FileJson, Info } from 'lucide-react';
import { analyzeFile, getPolicies, runDemo } from '../lib/api';
import { cn } from '../lib/utils';

export default function UploadPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState('');
  const [policyId, setPolicyId] = useState('enterprise-safe');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const { data: policies = [] } = useQuery({
    queryKey: ['policies'],
    queryFn: getPolicies,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeFile(file!, projectName || file!.name, policyId),
    onSuccess: (result) => navigate(`/analysis/${result.id}`),
    onError: (e: any) => setError(e.response?.data?.detail || e.message),
  });

  const demoMutation = useMutation({
    mutationFn: () => runDemo(policyId),
    onSuccess: (result) => navigate(`/analysis/${result.id}`),
    onError: (e: any) => setError(e.response?.data?.detail || e.message),
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      if (!projectName) setProjectName(dropped.name.replace(/\.(json|txt|xml|lock)$/, ''));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (!projectName) setProjectName(f.name.replace(/\.(json|txt|xml|lock)$/, ''));
    }
  };

  const isLoading = analyzeMutation.isPending || demoMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
          <Shield className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">LicenseLens</h1>
        <p className="mt-2 text-gray-500">
          Analyze open-source licenses, detect risks, and ensure policy compliance.
        </p>
      </div>

      <div className="card space-y-5">
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50',
            file && 'border-green-400 bg-green-50'
          )}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".json,.txt,.xml,.lock"
            onChange={handleFileChange}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileJson className="w-10 h-10 text-green-500" />
              <p className="font-medium text-green-700">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB — click to change</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Upload className="w-10 h-10 text-gray-400" />
              <p className="font-medium">Drop a dependency file here</p>
              <p className="text-sm">or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">
                Supported: package.json · package-lock.json · requirements.txt · Pipfile.lock · pom.xml
              </p>
            </div>
          )}
        </div>

        {/* Project name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="my-project"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Policy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            License Policy
          </label>
          <select
            value={policyId}
            onChange={(e) => setPolicyId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {policies.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {policies.find((p) => p.id === policyId) && (
            <p className="mt-1 text-xs text-gray-500 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              {policies.find((p) => p.id === policyId)?.description}
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={!file || isLoading}
            className="btn-primary flex-1 justify-center"
          >
            <Upload className="w-4 h-4" />
            {analyzeMutation.isPending ? 'Analyzing…' : 'Analyze File'}
          </button>

          <button
            onClick={() => demoMutation.mutate()}
            disabled={isLoading}
            className="btn-secondary flex-1 justify-center"
          >
            <FlaskConical className="w-4 h-4" />
            {demoMutation.isPending ? 'Running…' : 'Run Demo'}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FileJson, title: 'Upload', desc: 'Drop your package.json, requirements.txt, or pom.xml' },
          { icon: Shield, title: 'Analyze', desc: 'We identify every license and check against your policy' },
          { icon: AlertTriangle, title: 'Review', desc: 'Get clear risk scores, conflict explanations, and a visual graph' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card text-center py-5">
            <Icon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-gray-500 mt-1">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
