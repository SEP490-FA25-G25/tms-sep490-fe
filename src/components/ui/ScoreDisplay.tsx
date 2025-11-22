import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScoreDisplayProps {
  score: number; // Normalized percentage (0-100)
  courseType?: string; // 'IELTS', 'TOEIC', 'JLPT', 'HSK', etc.
  scoreScale?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreDisplay({
  score,
  courseType,
  scoreScale,
  size = 'md',
  className
}: ScoreDisplayProps) {
  const getFormattedScore = (): string => {
    switch (courseType?.toUpperCase()) {
      case 'IELTS':
        return `${(score * 9 / 100).toFixed(1)}/9.0`;
      case 'TOEIC':
        return `${Math.round(score * 495 / 100)}/495`;
      case 'JLPT':
      case 'HSK':
        return `${Math.round(score)}/100`;
      default:
        return score.toFixed(1);
    }
  };

  const getScoreLabel = (): string => {
    switch (courseType?.toUpperCase()) {
      case 'IELTS':
        return 'IELTS';
      case 'TOEIC':
        return 'TOEIC';
      case 'JLPT':
        return 'JLPT';
      case 'HSK':
        return 'HSK';
      default:
        return scoreScale ? `(${scoreScale})` : 'Điểm';
    }
  };

  const getScoreColor = (normalizedScore: number): string => {
    if (normalizedScore >= 80) return 'text-success';
    if (normalizedScore >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          value: 'text-lg font-semibold',
          label: 'text-sm font-medium',
          details: 'text-xs'
        };
      case 'lg':
        return {
          value: 'text-3xl font-bold',
          label: 'text-sm font-medium',
          details: 'text-xs'
        };
      default: // md
        return {
          value: 'text-2xl font-bold',
          label: 'text-sm font-medium',
          details: 'text-xs'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <BarChart3 className={cn('h-4 w-4', getScoreColor(score))} />
        <span className={cn(sizeClasses.value, getScoreColor(score))}>
          {getFormattedScore()}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <BarChart3 className="h-5 w-5" />
        <span className={sizeClasses.label}>Điểm trung bình</span>
      </div>
      <div className="space-y-1">
        <div className={cn(sizeClasses.value, getScoreColor(score))}>
          {getFormattedScore()}
        </div>
        {courseType && (
          <p className={cn(sizeClasses.details, 'text-muted-foreground')}>
            Trên thang điểm {getScoreLabel()}
          </p>
        )}
      </div>
    </div>
  );
}