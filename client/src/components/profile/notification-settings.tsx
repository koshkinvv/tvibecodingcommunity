import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ProfileData, User } from '@/lib/types';

interface NotificationSettingsProps {
  user: User;
}

const telegramSchema = z.object({
  verificationCode: z.string().min(3, { message: "Verification code must be at least 3 characters" })
});

type TelegramFormValues = z.infer<typeof telegramSchema>;

export function NotificationSettings({ user }: NotificationSettingsProps) {
  const [showTelegramVerification, setShowTelegramVerification] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TelegramFormValues>({
    resolver: zodResolver(telegramSchema),
    defaultValues: {
      verificationCode: ''
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { notificationPreference: 'email' | 'telegram' }) => {
      return apiRequest('PATCH', '/api/profile', data);
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const verifyTelegramMutation = useMutation({
    mutationFn: async (data: TelegramFormValues) => {
      return apiRequest('POST', '/api/telegram/verify', data);
    },
    onSuccess: () => {
      toast({
        title: "Telegram verified",
        description: "Your Telegram account has been successfully linked."
      });
      setShowTelegramVerification(false);
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to verify Telegram: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleNotificationChange = (value: 'email' | 'telegram') => {
    if (value === 'telegram' && !user.telegramId) {
      setShowTelegramVerification(true);
    } else {
      updateSettingsMutation.mutate({ notificationPreference: value });
    }
  };

  const onSubmitTelegramCode = (data: TelegramFormValues) => {
    verifyTelegramMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          defaultValue={user.notificationPreference} 
          onValueChange={(value) => handleNotificationChange(value as 'email' | 'telegram')}
          className="space-y-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="email" id="email-notifications" />
            <Label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-900">
              Email {user.email ? `(${user.email})` : ''}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="telegram" id="telegram-notifications" />
            <Label htmlFor="telegram-notifications" className="ml-2 block text-sm text-gray-900">
              Telegram {user.telegramId ? '(Connected)' : ''}
            </Label>
          </div>
        </RadioGroup>

        {showTelegramVerification && (
          <div className="mt-4 p-4 border border-gray-200 rounded-md">
            <h4 className="font-medium mb-2">Connect Telegram</h4>
            <ol className="list-decimal list-inside mb-4 text-sm text-gray-700">
              <li>Start a chat with our Telegram bot: <a href="https://t.me/vibecoding_bot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@vibecoding_bot</a></li>
              <li>Send the command: <code className="bg-gray-100 px-1 rounded">/start</code></li>
              <li>The bot will reply with a verification code</li>
              <li>Enter that code below</li>
            </ol>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitTelegramCode)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="verificationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter verification code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    disabled={verifyTelegramMutation.isPending}
                  >
                    {verifyTelegramMutation.isPending ? 'Verifying...' : 'Verify'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowTelegramVerification(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
