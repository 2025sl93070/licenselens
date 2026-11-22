import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { LicenseInfo } from '../types';
import RiskBadge from '../components/RiskBadge';
import { BookOpen, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

export default function LicenseGlossaryPage() {
  const { data: licenses = [], isLoading } = useQuery<LicenseInfo[]>({
    queryKey: ['licenses'],
    queryFn: async () => {
      const { data } = await axios.get('/api/licenses');
      return data;
    },
  });

  const byCategory = licenses.reduce((acc, l) => {
    if (!acc[l.category]) acc[l.category] = [];
    acc[l.category].push(l);
    return acc;
  }, {} as Record<string, LicenseInfo[]>);

  const categoryOrder = ['permissive', 'weak-copyleft', 'strong-copyleft', 'network-copyleft', 'public-domain', 'unknown'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-500" />
        <h1 className="text-xl font-bold text-gray-900">License Glossary</h1>
      </div>

      {categoryOrder.filter((c) => byCategory[c]).map((category) => (
        <div key={category}>
          <h2 className="text-base font-semibold text-gray-700 capitalize mb-3">
            {category.replace(/-/g, ' ')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byCategory[category].map((lic) => (
              <div key={lic.id} className="card py-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{lic.name}</p>
                    <p className="text-xs font-mono text-gray-500">{lic.spdxId}</p>
                  </div>
                  <RiskBadge level={lic.riskLevel} />
                </div>

                <div className="grid grid-cols-2 gap-1 text-xs">
                  {[
                    ['Commercial use', lic.commercialUse],
                    ['Modification', lic.modification],
                    ['Distribution', lic.distribution],
                    ['Copyleft', lic.copyleft],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex items-center gap-1">
                      {val ? (
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      )}
                      <span className="text-gray-600">{label as string}</span>
                    </div>
                  ))}
                </div>

                {lic.conditions.length > 0 && (
                  <p className="text-xs text-gray-500">
                    <strong>Conditions:</strong> {lic.conditions.join(', ')}
                  </p>
                )}

                {lic.url && (
                  <a
                    href={lic.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View license text
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
