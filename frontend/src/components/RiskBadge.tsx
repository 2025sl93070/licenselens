import { RiskLevel } from '../types';
import { riskBg } from '../lib/utils';
import { cn } from '../lib/utils';

interface Props {
  level: RiskLevel;
  className?: string;
}

export default function RiskBadge({ level, className }: Props) {
  return (
    <span className={cn('badge', riskBg(level), className)}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}
