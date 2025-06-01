import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Users, Trophy, Plus, ExternalLink } from "lucide-react";
import { Challenge, ChallengeParticipant, User } from "@shared/schema";
import { useState } from "react";

const createChallengeSchema = z.object({
  title: z.string().min(1, "Название обязательно"),
  description: z.string().min(1, "Описание обязательно"),
  requirements: z.string().min(1, "Требования обязательны"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  technologies: z.array(z.string()).default([]),
  xpReward: z.number().min(0),
  startDate: z.string(),
  endDate: z.string(),
  maxParticipants: z.number().optional(),
});

const submitChallengeSchema = z.object({
  submissionUrl: z.string().url("Введите корректный URL"),
});

type CreateChallengeForm = z.infer<typeof createChallengeSchema>;
type SubmitChallengeForm = z.infer<typeof submitChallengeSchema>;

export default function ChallengesPage() {
  const { toast } = useToast();
  const [techInput, setTechInput] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const { data: challenges = [], isLoading } = useQuery<(Challenge & { creator: User; participants: ChallengeParticipant[] })[]>({
    queryKey: ["/api/challenges"],
  });

  const createForm = useForm<CreateChallengeForm>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      difficulty: "beginner",
      technologies: [],
      xpReward: 0,
      startDate: "",
      endDate: "",
    },
  });

  const submitForm = useForm<SubmitChallengeForm>({
    resolver: zodResolver(submitChallengeSchema),
    defaultValues: {
      submissionUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateChallengeForm) => apiRequest("/api/challenges", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "Успех",
        description: "Вызов создан успешно!",
      });
      createForm.reset();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать вызов",
        variant: "destructive",
      });
    },
  });

  const joinMutation = useMutation({
    mutationFn: (challengeId: number) => apiRequest(`/api/challenges/${challengeId}/join`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "Успех",
        description: "Вы присоединились к вызову!",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось присоединиться к вызову",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: ({ challengeId, data }: { challengeId: number; data: SubmitChallengeForm }) =>
      apiRequest(`/api/challenges/${challengeId}/submit`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "Успех",
        description: "Решение отправлено!",
      });
      submitForm.reset();
      setSelectedChallenge(null);
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить решение",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: CreateChallengeForm) => {
    createMutation.mutate(data);
  };

  const onSubmitSubmit = (data: SubmitChallengeForm) => {
    if (selectedChallenge) {
      submitMutation.mutate({ challengeId: selectedChallenge.id, data });
    }
  };

  const addTechnology = () => {
    if (techInput.trim()) {
      const currentTechs = createForm.getValues("technologies");
      if (!currentTechs.includes(techInput.trim())) {
        createForm.setValue("technologies", [...currentTechs, techInput.trim()]);
      }
      setTechInput("");
    }
  };

  const removeTechnology = (tech: string) => {
    const currentTechs = createForm.getValues("technologies");
    createForm.setValue("technologies", currentTechs.filter(t => t !== tech));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Начинающий';
      case 'intermediate': return 'Средний';
      case 'advanced': return 'Продвинутый';
      default: return difficulty;
    }
  };

  const isUpcoming = (startDate: string) => new Date(startDate) > new Date();
  const isActive = (startDate: string, endDate: string) => {
    const now = new Date();
    return new Date(startDate) <= now && new Date(endDate) >= now;
  };
  const isEnded = (endDate: string) => new Date(endDate) < new Date();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Вызовы сообщества
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Участвуйте в вызовах и развивайте свои навыки программирования
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Создать вызов
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Создать новый вызов</DialogTitle>
              <DialogDescription>
                Создайте вызов для сообщества разработчиков
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Создать TODO приложение" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Детальное описание вызова..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Требования</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Что нужно сделать для выполнения вызова..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Сложность</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите сложность" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Начинающий</SelectItem>
                            <SelectItem value="intermediate">Средний</SelectItem>
                            <SelectItem value="advanced">Продвинутый</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="xpReward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Награда XP</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            placeholder="100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormLabel>Технологии</FormLabel>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      placeholder="React, TypeScript..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                    />
                    <Button type="button" onClick={addTechnology} variant="outline">
                      Добавить
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {createForm.watch("technologies").map((tech) => (
                      <Badge key={tech} variant="secondary" className="cursor-pointer" onClick={() => removeTechnology(tech)}>
                        {tech} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата начала</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата окончания</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Максимум участников (необязательно)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="Без ограничений"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Создание..." : "Создать вызов"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => {
          const upcoming = isUpcoming(challenge.startDate);
          const active = isActive(challenge.startDate, challenge.endDate);
          const ended = isEnded(challenge.endDate);

          return (
            <Card key={challenge.id} className={`relative overflow-hidden ${
              active ? 'border-green-500 dark:border-green-400' : 
              upcoming ? 'border-blue-500 dark:border-blue-400' : 
              'opacity-75'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{challenge.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {challenge.description}
                    </CardDescription>
                  </div>
                  <div className="ml-2">
                    {upcoming && <Badge variant="outline" className="text-blue-600">Предстоящий</Badge>}
                    {active && <Badge variant="outline" className="text-green-600">Активный</Badge>}
                    {ended && <Badge variant="outline" className="text-gray-600">Завершен</Badge>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className={getDifficultyColor(challenge.difficulty)}>
                    {getDifficultyLabel(challenge.difficulty)}
                  </Badge>
                  {(challenge.technologies as string[]).map((tech) => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(challenge.startDate).toLocaleDateString('ru-RU')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(challenge.endDate).toLocaleDateString('ru-RU')}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{challenge.participants.length} участников</span>
                    {challenge.maxParticipants && (
                      <span className="text-gray-500">/ {challenge.maxParticipants}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <Trophy className="w-4 h-4" />
                    +{challenge.xpReward} XP
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Создатель: {challenge.creator.username}
                </div>

                <div className="flex gap-2 pt-2">
                  {active && (
                    <Button 
                      size="sm" 
                      onClick={() => joinMutation.mutate(challenge.id)}
                      disabled={joinMutation.isPending}
                      className="flex-1"
                    >
                      Участвовать
                    </Button>
                  )}
                  
                  {active && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedChallenge(challenge)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Отправить решение</DialogTitle>
                          <DialogDescription>
                            Отправьте ссылку на ваше решение вызова "{challenge.title}"
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...submitForm}>
                          <form onSubmit={submitForm.handleSubmit(onSubmitSubmit)} className="space-y-4">
                            <FormField
                              control={submitForm.control}
                              name="submissionUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>URL решения</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="https://github.com/username/repo" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" disabled={submitMutation.isPending}>
                              {submitMutation.isPending ? "Отправка..." : "Отправить"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {challenges.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Нет активных вызовов
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Создайте первый вызов для сообщества!
          </p>
        </div>
      )}
    </div>
  );
}