import { Repository } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { Clock, GitCommit, Sparkles } from "lucide-react";

interface RepositorySummaryProps {
  repository: Repository;
}

export function RepositorySummary({ repository }: RepositorySummaryProps) {
  const hasChanges = repository.changesSummary && repository.summaryGeneratedAt;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            {repository.name}
          </CardTitle>
          <Badge variant={
            repository.status === 'active' ? 'default' :
            repository.status === 'warning' ? 'secondary' :
            repository.status === 'inactive' ? 'destructive' : 'outline'
          }>
            {repository.status === 'active' ? 'Активен' :
             repository.status === 'warning' ? 'Предупреждение' :
             repository.status === 'inactive' ? 'Неактивен' : 'Ожидание'}
          </Badge>
        </div>
        {repository.lastCommitDate && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Последний коммит: {formatRelativeTime(new Date(repository.lastCommitDate))}
          </div>
        )}
      </CardHeader>
      
      {hasChanges && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Краткое описание изменений
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm leading-relaxed">
                {repository.changesSummary}
              </p>
            </div>
            
            {repository.summaryGeneratedAt && (
              <div className="text-xs text-muted-foreground">
                Проанализировано: {formatRelativeTime(new Date(repository.summaryGeneratedAt))}
              </div>
            )}
          </div>
        </CardContent>
      )}
      
      {!hasChanges && (
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground italic">
            Пока нет информации об изменениях в репозитории
          </div>
        </CardContent>
      )}
    </Card>
  );
}