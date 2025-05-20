import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

export type StatusType = 'active' | 'warning' | 'inactive' | 'pending';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case 'active':
        return 'active';
      case 'warning':
        return 'warning';
      case 'inactive':
        return 'inactive';
      case 'pending':
      default:
        return 'secondary';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'warning':
        return 'Warning';
      case 'inactive':
        return 'Inactive';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  const getCircleColor = () => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'inactive':
        return 'text-red-400';
      case 'pending':
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Badge variant={getVariant()} className={`flex items-center ${className}`}>
      <Circle className={`-ml-0.5 mr-1.5 h-2 w-2 ${getCircleColor()}`} fill="currentColor" />
      {getLabel()}
    </Badge>
  );
}
