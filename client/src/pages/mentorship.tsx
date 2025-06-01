import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Users, BookOpen, Plus, Star, Eye, Heart } from "lucide-react";
import { User, Mentorship, LearningResource } from "@shared/schema";
import { useState } from "react";

const createMentorshipSchema = z.object({
  menteeId: z.number(),
  technologies: z.array(z.string()).default([]),
  goals: z.string().optional(),
});

const createResourceSchema = z.object({
  title: z.string().min(1, "Название обязательно"),
  description: z.string().min(1, "Описание обязательно"),
  content: z.string().min(1, "Содержание обязательно"),
  type: z.enum(["tutorial", "article", "video", "workshop"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  technologies: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
});

type CreateMentorshipForm = z.infer<typeof createMentorshipSchema>;
type CreateResourceForm = z.infer<typeof createResourceSchema>;

export default function MentorshipPage() {
  const { toast } = useToast();
  const [techInput, setTechInput] = useState("");
  const [resourceTechInput, setResourceTechInput] = useState("");

  const { data: mentors = [], isLoading: mentorsLoading } = useQuery<User[]>({
    queryKey: ["/api/mentors"],
  });

  const { data: mentorships = [] } = useQuery<(Mentorship & { mentor: User; mentee: User })[]>({
    queryKey: ["/api/mentorships"],
  });

  const { data: resources = [], isLoading: resourcesLoading } = useQuery<(LearningResource & { author: User })[]>({
    queryKey: ["/api/learning-resources"],
  });

  const mentorshipForm = useForm<CreateMentorshipForm>({
    resolver: zodResolver(createMentorshipSchema),
    defaultValues: {
      technologies: [],
      goals: "",
    },
  });

  const resourceForm = useForm<CreateResourceForm>({
    resolver: zodResolver(createResourceSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      type: "tutorial",
      difficulty: "beginner",
      technologies: [],
      isPublished: false,
    },
  });

  const createMentorshipMutation = useMutation({
    mutationFn: (data: CreateMentorshipForm) => apiRequest("/api/mentorships", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentorships"] });
      toast({
        title: "Успех",
        description: "Запрос на менторство отправлен!",
      });
      mentorshipForm.reset();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить запрос на менторство",
        variant: "destructive",
      });
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: (data: CreateResourceForm) => apiRequest("/api/learning-resources", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning-resources"] });
      toast({
        title: "Успех",
        description: "Обучающий ресурс создан!",
      });
      resourceForm.reset();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать обучающий ресурс",
        variant: "destructive",
      });
    },
  });

  const onMentorshipSubmit = (data: CreateMentorshipForm) => {
    createMentorshipMutation.mutate(data);
  };

  const onResourceSubmit = (data: CreateResourceForm) => {
    createResourceMutation.mutate(data);
  };

  const addTechnology = (form: any, input: string, setInput: (value: string) => void) => {
    if (input.trim()) {
      const currentTechs = form.getValues("technologies");
      if (!currentTechs.includes(input.trim())) {
        form.setValue("technologies", [...currentTechs, input.trim()]);
      }
      setInput("");
    }
  };

  const removeTechnology = (form: any, tech: string) => {
    const currentTechs = form.getValues("technologies");
    form.setValue("technologies", currentTechs.filter((t: string) => t !== tech));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tutorial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'article': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'video': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'workshop': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'tutorial': return 'Туториал';
      case 'article': return 'Статья';
      case 'video': return 'Видео';
      case 'workshop': return 'Воркшоп';
      default: return type;
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Менторство и обучение
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Найдите ментора или поделитесь знаниями с сообществом
        </p>
      </div>

      <Tabs defaultValue="mentors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mentors">Менторы</TabsTrigger>
          <TabsTrigger value="mentorships">Мои менторства</TabsTrigger>
          <TabsTrigger value="resources">Обучающие ресурсы</TabsTrigger>
        </TabsList>

        <TabsContent value="mentors" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Доступные менторы
            </h2>
          </div>

          {mentorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => (
                <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={mentor.avatarUrl || '/default-avatar.png'}
                        alt={mentor.name || mentor.username}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <CardTitle className="text-lg">{mentor.name || mentor.username}</CardTitle>
                        <CardDescription>@{mentor.username}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <UserCheck className="w-4 h-4 mr-2" />
                          Запросить менторство
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Запрос на менторство</DialogTitle>
                          <DialogDescription>
                            Отправьте запрос на менторство пользователю {mentor.name || mentor.username}
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...mentorshipForm}>
                          <form onSubmit={mentorshipForm.handleSubmit(onMentorshipSubmit)} className="space-y-4">
                            <input type="hidden" {...mentorshipForm.register("menteeId")} value={mentor.id} />
                            
                            <div>
                              <FormLabel>Технологии для изучения</FormLabel>
                              <div className="flex gap-2 mt-1">
                                <Input
                                  value={techInput}
                                  onChange={(e) => setTechInput(e.target.value)}
                                  placeholder="React, TypeScript..."
                                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology(mentorshipForm, techInput, setTechInput))}
                                />
                                <Button type="button" onClick={() => addTechnology(mentorshipForm, techInput, setTechInput)} variant="outline">
                                  Добавить
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {mentorshipForm.watch("technologies").map((tech) => (
                                  <Badge key={tech} variant="secondary" className="cursor-pointer" onClick={() => removeTechnology(mentorshipForm, tech)}>
                                    {tech} ×
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <FormField
                              control={mentorshipForm.control}
                              name="goals"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Цели обучения (необязательно)</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Что вы хотите изучить или достичь..." rows={3} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button type="submit" disabled={createMentorshipMutation.isPending}>
                              {createMentorshipMutation.isPending ? "Отправка..." : "Отправить запрос"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {mentors.length === 0 && !mentorsLoading && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Менторы не найдены
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Станьте ментором, достигнув 3 уровня!
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mentorships" className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Активные менторства
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mentorships.map((mentorship) => (
              <Card key={mentorship.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Ментор: {mentorship.mentor.name || mentorship.mentor.username}
                    </CardTitle>
                    <Badge variant={mentorship.status === 'active' ? 'default' : 'secondary'}>
                      {mentorship.status === 'active' ? 'Активно' : 
                       mentorship.status === 'pending' ? 'Ожидание' :
                       mentorship.status === 'completed' ? 'Завершено' : 'Отменено'}
                    </Badge>
                  </div>
                  <CardDescription>
                    Начато: {mentorship.startDate ? new Date(mentorship.startDate.toString()).toLocaleDateString('ru-RU') : 'Не начато'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mentorship.goals && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Цели:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{mentorship.goals}</p>
                    </div>
                  )}
                  
                  {(mentorship.technologies as string[]).length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">Технологии:</h4>
                      <div className="flex flex-wrap gap-1">
                        {(mentorship.technologies as string[]).map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {mentorships.length === 0 && (
            <div className="text-center py-12">
              <UserCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Нет активных менторств
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Найдите ментора на вкладке "Менторы"
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Обучающие ресурсы
            </h2>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать ресурс
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Создать обучающий ресурс</DialogTitle>
                  <DialogDescription>
                    Поделитесь знаниями с сообществом
                  </DialogDescription>
                </DialogHeader>
                <Form {...resourceForm}>
                  <form onSubmit={resourceForm.handleSubmit(onResourceSubmit)} className="space-y-4">
                    <FormField
                      control={resourceForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Введение в React Hooks" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={resourceForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Описание</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Краткое описание ресурса..." rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={resourceForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Содержание</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Подробное содержание ресурса..." rows={6} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={resourceForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Тип</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите тип" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="tutorial">Туториал</SelectItem>
                                <SelectItem value="article">Статья</SelectItem>
                                <SelectItem value="video">Видео</SelectItem>
                                <SelectItem value="workshop">Воркшоп</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={resourceForm.control}
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
                    </div>

                    <div>
                      <FormLabel>Технологии</FormLabel>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={resourceTechInput}
                          onChange={(e) => setResourceTechInput(e.target.value)}
                          placeholder="React, TypeScript..."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology(resourceForm, resourceTechInput, setResourceTechInput))}
                        />
                        <Button type="button" onClick={() => addTechnology(resourceForm, resourceTechInput, setResourceTechInput)} variant="outline">
                          Добавить
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {resourceForm.watch("technologies").map((tech) => (
                          <Badge key={tech} variant="secondary" className="cursor-pointer" onClick={() => removeTechnology(resourceForm, tech)}>
                            {tech} ×
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <FormField
                      control={resourceForm.control}
                      name="isPublished"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Опубликовать сразу</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={createResourceMutation.isPending}>
                      {createResourceMutation.isPending ? "Создание..." : "Создать ресурс"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {resourcesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{resource.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {resource.description}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={getTypeColor(resource.type)}>
                        {getTypeLabel(resource.type)}
                      </Badge>
                      <Badge className={getDifficultyColor(resource.difficulty)}>
                        {getDifficultyLabel(resource.difficulty)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {(resource.technologies as string[]).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {resource.views}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {resource.likes}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {resource.author.username}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {resource.createdAt ? new Date(resource.createdAt as string | Date).toLocaleDateString('ru-RU') : ''}
                    </div>

                    <Button variant="outline" className="w-full">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Читать
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {resources.length === 0 && !resourcesLoading && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Нет обучающих ресурсов
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Создайте первый обучающий ресурс для сообщества!
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}