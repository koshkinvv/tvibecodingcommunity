import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Code, 
  Database, 
  Shield, 
  Globe, 
  Settings,
  ChevronRight,
  ExternalLink,
  Lightbulb
} from 'lucide-react';

interface PerformanceOptimization {
  id: string;
  category: 'code' | 'architecture' | 'database' | 'frontend' | 'security' | 'deployment';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  implementation: {
    steps: string[];
    codeExample?: string;
    resources: string[];
  };
  metrics: {
    expectedImprovement: string;
    measurableKPIs: string[];
  };
}

interface RepositoryAnalysis {
  repositoryId: number;
  repositoryName: string;
  overallScore: number;
  optimizations: PerformanceOptimization[];
  summary: {
    criticalIssues: number;
    quickWins: number;
    estimatedImprovementTime: string;
  };
  generatedAt: string;
}

interface PerformanceOverview {
  repositories: RepositoryAnalysis[];
  summary: {
    totalRepositories: number;
    analyzedRepositories: number;
    averageScore: number;
    totalOptimizations: number;
    criticalIssues: number;
    quickWins: number;
  };
}

export default function PerformancePage() {
  const { user } = useAuth();
  const [selectedRepository, setSelectedRepository] = useState<number | null>(null);

  // Fetch performance overview
  const { data: overview, isLoading, error } = useQuery<PerformanceOverview>({
    queryKey: ['/api/user/performance-overview'],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to view performance optimization suggestions.</p>
            <Button asChild>
              <a href="/api/auth/github">Sign in with GitHub</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-96 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analysis Error</h2>
            <p className="text-gray-600">Unable to analyze your repositories. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'code': return <Code className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'frontend': return <Globe className="w-4 h-4" />;
      case 'deployment': return <Settings className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedRepoAnalysis = selectedRepository 
    ? overview.repositories.find(r => r.repositoryId === selectedRepository)
    : null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Performance Optimization</h1>
            <p className="text-gray-600 mt-1">AI-powered performance suggestions for your repositories</p>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Powered by AI</span>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.summary.averageScore}/100</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.summary.criticalIssues}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Lightbulb className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Quick Wins</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.summary.quickWins}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Suggestions</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.summary.totalOptimizations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="repositories">Repository Details</TabsTrigger>
            <TabsTrigger value="optimizations">All Optimizations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Repository Performance Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {overview.repositories.map((repo) => (
                <Card key={repo.repositoryId} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedRepository(repo.repositoryId)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{repo.repositoryName.split('/')[1]}</CardTitle>
                      <Badge variant={repo.overallScore >= 80 ? 'default' : repo.overallScore >= 60 ? 'secondary' : 'destructive'}>
                        {repo.overallScore}/100
                      </Badge>
                    </div>
                    <Progress value={repo.overallScore} className="h-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Optimizations:</span>
                        <span className="font-medium">{repo.optimizations.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Critical Issues:</span>
                        <span className="font-medium text-red-600">{repo.summary.criticalIssues}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Quick Wins:</span>
                        <span className="font-medium text-green-600">{repo.summary.quickWins}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Est. Time:</span>
                        <span className="font-medium">{repo.summary.estimatedImprovementTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="repositories" className="space-y-6">
            {selectedRepoAnalysis ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedRepoAnalysis.repositoryName}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Analyzed on {new Date(selectedRepoAnalysis.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={selectedRepoAnalysis.overallScore >= 80 ? 'default' : 'destructive'} className="text-lg px-3 py-1">
                        {selectedRepoAnalysis.overallScore}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={selectedRepoAnalysis.overallScore} className="h-3 mb-4" />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-red-600">{selectedRepoAnalysis.summary.criticalIssues}</p>
                        <p className="text-sm text-gray-600">Critical Issues</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{selectedRepoAnalysis.summary.quickWins}</p>
                        <p className="text-sm text-gray-600">Quick Wins</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{selectedRepoAnalysis.optimizations.length}</p>
                        <p className="text-sm text-gray-600">Total Suggestions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Optimizations for selected repository */}
                <div className="space-y-4">
                  {selectedRepoAnalysis.optimizations
                    .sort((a, b) => b.priority - a.priority)
                    .map((optimization) => (
                      <Card key={optimization.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                {getCategoryIcon(optimization.category)}
                              </div>
                              <div>
                                <CardTitle className="text-lg">{optimization.title}</CardTitle>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={getImpactColor(optimization.impact)}>
                                    {optimization.impact} impact
                                  </Badge>
                                  <Badge className={getEffortColor(optimization.effort)}>
                                    {optimization.effort} effort
                                  </Badge>
                                  <Badge variant="outline">
                                    Priority: {optimization.priority}/10
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-4">{optimization.description}</p>
                          
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Implementation Steps:</h4>
                              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                                {optimization.implementation.steps.map((step, index) => (
                                  <li key={index}>{step}</li>
                                ))}
                              </ol>
                            </div>

                            {optimization.implementation.codeExample && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Code Example:</h4>
                                <pre className="bg-gray-100 p-3 rounded-lg text-sm overflow-x-auto">
                                  {optimization.implementation.codeExample}
                                </pre>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Expected Improvement:</h4>
                                <p className="text-sm text-gray-700">{optimization.metrics.expectedImprovement}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Resources:</h4>
                                <ul className="space-y-1">
                                  {optimization.implementation.resources.map((resource, index) => (
                                    <li key={index} className="text-sm text-blue-600 hover:underline cursor-pointer flex items-center">
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      {resource}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600">Select a repository from the overview to see detailed optimization suggestions.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="optimizations" className="space-y-4">
            {overview.repositories.flatMap(repo => 
              repo.optimizations.map(opt => ({ ...opt, repoName: repo.repositoryName }))
            )
            .sort((a, b) => b.priority - a.priority)
            .map((optimization) => (
              <Card key={`${optimization.repoName}-${optimization.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getCategoryIcon(optimization.category)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{optimization.title}</CardTitle>
                        <p className="text-sm text-gray-600">{optimization.repoName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getImpactColor(optimization.impact)}>
                        {optimization.impact}
                      </Badge>
                      <Badge className={getEffortColor(optimization.effort)}>
                        {optimization.effort} effort
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{optimization.description}</p>
                  <div className="mt-3 flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    Expected improvement: {optimization.metrics.expectedImprovement}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}