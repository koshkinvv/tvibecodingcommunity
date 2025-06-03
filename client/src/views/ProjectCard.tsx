import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GitBranch, Calendar, User, Activity } from "lucide-react";
import { ProjectWithDetails, ProjectModel } from "@/models/ProjectModel";
import { CommentSection } from "./CommentSection";

interface ProjectCardProps {
  project: ProjectWithDetails;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={project.user.avatarUrl || ""} />
              <AvatarFallback>
                {project.user.name?.charAt(0) || project.user.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <User className="h-3 w-3" />
                {project.user.name || project.user.username}
              </p>
            </div>
          </div>
          <Badge className={`${ProjectModel.getStatusColor(project.status)} border-0`}>
            {ProjectModel.getStatusText(project.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* AI-generated description */}
        {project.description && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">{project.description}</p>
            {project.descriptionGeneratedAt && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Описание создано AI
              </p>
            )}
          </div>
        )}

        {/* Project details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <GitBranch className="h-4 w-4" />
            <span>{project.fullName}</span>
          </div>
          {project.lastCommitDate && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                Последний коммит: {ProjectModel.formatDate(project.lastCommitDate)}
              </span>
            </div>
          )}
        </div>

        {/* Comments section */}
        <CommentSection repository={project} />
      </CardContent>
    </Card>
  );
}