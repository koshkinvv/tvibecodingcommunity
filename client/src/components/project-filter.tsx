import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ProjectFilterProps {
  onFilterChange: (filters: {
    tags: string[];
    category: string;
    complexity: string;
    search: string;
  }) => void;
}

export function ProjectFilter({ onFilterChange }: ProjectFilterProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedComplexity, setSelectedComplexity] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Получение доступных тегов
  const { data: tagsData } = useQuery({
    queryKey: ['/api/projects/tags'],
    queryFn: async () => {
      const response = await fetch('/api/projects/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json();
    }
  });

  // Уведомление родительского компонента об изменении фильтров
  useEffect(() => {
    onFilterChange({
      tags: selectedTags,
      category: selectedCategory === "all" ? "" : selectedCategory,
      complexity: selectedComplexity === "all" ? "" : selectedComplexity,
      search: searchTerm
    });
  }, [selectedTags, selectedCategory, selectedComplexity, searchTerm, onFilterChange]);

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    setSelectedCategory("all");
    setSelectedComplexity("all");
    setSearchTerm("");
  };

  if (!tagsData) return null;

  const { availableTags, usedTags } = tagsData;

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Фильтры проектов
        </h3>
        {(selectedTags.length > 0 || selectedCategory || selectedComplexity || searchTerm) && (
          <Button variant="outline" size="sm" onClick={clearAllFilters}>
            Очистить все
          </Button>
        )}
      </div>

      {/* Поиск */}
      <div>
        <Label htmlFor="search">Поиск по названию</Label>
        <Input
          id="search"
          placeholder="Введите название проекта..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Категория */}
      <div>
        <Label>Категория</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите категорию" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            <SelectItem value="веб-разработка">Веб-разработка</SelectItem>
            <SelectItem value="мобильные приложения">Мобильные приложения</SelectItem>
            <SelectItem value="игры">Игры</SelectItem>
            <SelectItem value="утилиты">Утилиты</SelectItem>
            <SelectItem value="библиотеки">Библиотеки</SelectItem>
            <SelectItem value="десктоп-приложения">Десктоп приложения</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Уровень сложности */}
      <div>
        <Label>Уровень сложности</Label>
        <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите уровень" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Любой уровень</SelectItem>
            <SelectItem value="beginner">Начинающий</SelectItem>
            <SelectItem value="intermediate">Средний</SelectItem>
            <SelectItem value="advanced">Продвинутый</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Выбранные теги */}
      {selectedTags.length > 0 && (
        <div>
          <Label>Выбранные теги</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Доступные теги по категориям */}
      {Object.entries(availableTags).map(([category, tags]) => (
        <div key={category}>
          <Label>{category}</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {(tags as string[]).map(tag => (
              <Badge 
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      ))}

      {/* Используемые теги */}
      {usedTags.length > 0 && (
        <div>
          <Label>Теги в проектах</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {usedTags.map((tag: string) => (
              <Badge 
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}