import { useQuery } from '@tanstack/react-query';
import { getHistory } from '../lib/api';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { formatTimestamp } from '../lib/utils';

export default function HistoryPage() {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: getHistory,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-blue-500" />
        <h1 className="text-xl font-bold text-gray-900">Analysis History</h1>
      </div>

      {history.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No analyses yet. <Link to="/" className="text-blue-500 hover:underline">Run your first analysis →</Link></p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <Link
              key={item.id}
              to={`/analysis/${item.id}`}
              className="card flex items-center justify-between gap-4 hover:border-blue-300 transition-colors group py-4"
            >
              <div>
                <p className="font-medium text-gray-900">{item.projectName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.ecosystem} · {item.totalDependencies} deps · {formatTimestamp(item.timestamp)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <RiskBadge level={item.overallRisk} />
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
