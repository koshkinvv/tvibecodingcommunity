import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Umbrella, Calendar as CalendarIcon } from "lucide-react";
import { calculateVacationDays, formatDateForInput, getTwoWeeksFromNow } from '@/lib/utils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface VacationModeProps {
  user: User;
}

export function VacationMode({ user }: VacationModeProps) {
  const [isVacationMode, setIsVacationMode] = useState(user.onVacation);
  const [vacationDate, setVacationDate] = useState<Date | null>(
    user.vacationUntil ? new Date(user.vacationUntil) : getTwoWeeksFromNow()
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const vacationMutation = useMutation({
    mutationFn: async (data: { onVacation: boolean; vacationUntil: string | null }) => {
      return apiRequest('PATCH', '/api/profile', data);
    },
    onSuccess: () => {
      toast({
        title: isVacationMode ? "Vacation mode enabled" : "Vacation mode disabled",
        description: isVacationMode 
          ? `You won't receive notifications until ${vacationDate ? format(vacationDate, 'PPP') : 'your vacation ends'}.` 
          : "You'll now receive notifications for inactive repositories."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update vacation mode: ${error.message}`,
        variant: "destructive"
      });
      // Reset to previous state
      setIsVacationMode(user.onVacation);
    }
  });

  const handleVacationToggle = (enabled: boolean) => {
    setIsVacationMode(enabled);
    
    if (enabled && !vacationDate) {
      // Default to two weeks from now if no date is set
      setVacationDate(getTwoWeeksFromNow());
    }
    
    vacationMutation.mutate({ 
      onVacation: enabled, 
      vacationUntil: enabled && vacationDate ? format(vacationDate, 'yyyy-MM-dd') : null 
    });
  };

  const handleDateChange = (date: Date | null) => {
    setVacationDate(date);
    setIsCalendarOpen(false);
    
    if (isVacationMode && date) {
      vacationMutation.mutate({ 
        onVacation: true, 
        vacationUntil: format(date, 'yyyy-MM-dd')
      });
    }
  };

  const remainingDays = user.vacationUntil ? calculateVacationDays(user.vacationUntil) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Umbrella className="h-5 w-5 mr-2 text-primary" />
              Vacation Mode
            </CardTitle>
            <CardDescription>
              Pause activity checks while you're away
            </CardDescription>
          </div>
          <Switch 
            checked={isVacationMode}
            onCheckedChange={handleVacationToggle}
            disabled={vacationMutation.isPending}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isVacationMode ? (
          <div className="text-sm text-gray-600">
            <p>Your repositories won't be checked for activity until your vacation ends.</p>
            <div className="mt-4 flex items-center">
              <div className="mr-4">
                <div className="text-gray-700 font-medium">Vacation until:</div>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal mt-1",
                        !vacationDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {vacationDate ? format(vacationDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={vacationDate || undefined}
                      onSelect={handleDateChange}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {remainingDays > 0 && (
                <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                  {remainingDays} day{remainingDays !== 1 ? 's' : ''} remaining
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Enable vacation mode to pause activity checks while you're away. 
            We'll stop sending notifications and won't mark your repositories as inactive.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
