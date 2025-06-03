import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAddComment, useDeleteComment } from "@/hooks/useProjects";
import { ProjectWithDetails } from "@/models/ProjectModel";

interface CommentSectionProps {
  repository: ProjectWithDetails;
}

export function CommentSection({ repository }: CommentSectionProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(
        { repositoryId: repository.id, content: newComment.trim() },
        {
          onSuccess: () => {
            setNewComment("");
            setIsCommenting(false);
          }
        }
      );
    }
  };

  const handleDeleteComment = (commentId: number) => {
    if (window.confirm("Вы уверены, что хотите удалить комментарий?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        <span className="font-medium">Комментарии ({repository.comments.length})</span>
      </div>

      {/* Existing comments */}
      <div className="space-y-3">
        {repository.comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={comment.user.avatarUrl || ""} />
                  <AvatarFallback>
                    {comment.user.name?.charAt(0) || comment.user.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">
                  {comment.user.name || comment.user.username}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              {user?.id === comment.userId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-700">{comment.content}</p>
          </div>
        ))}
      </div>

      {/* Add new comment */}
      {isCommenting ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Напишите комментарий..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {newComment.length}/1000 символов
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCommenting(false);
                  setNewComment("");
                }}
              >
                Отменить
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
              >
                <Send className="h-3 w-3 mr-1" />
                {addCommentMutation.isPending ? "Отправка..." : "Отправить"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCommenting(true)}
          className="w-full"
        >
          <MessageCircle className="h-3 w-3 mr-2" />
          Добавить комментарий
        </Button>
      )}
    </div>
  );
}