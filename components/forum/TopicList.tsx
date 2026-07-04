"use client";

import { useState } from "react";
import { MessageSquare, Clock, User } from "lucide-react";
import { Topic } from "@/lib/forum-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TopicListProps {
  topics: Topic[];
  emptyMessage?: string;
  onTopicClick?: (topicId: string) => void;
}

export function TopicList({
  topics,
  emptyMessage = "No topics found",
  onTopicClick,
}: TopicListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  if (topics.length === 0) {
    return (
      <Card className="p-8 text-center border border-dashed">
        <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {topics.map((topic) => (
        <Card
          key={topic.id}
          className="p-4 hover:bg-muted/50 transition-colors cursor-pointer border border-border"
          onClick={() => onTopicClick?.(topic.id)}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1 truncate">
                {topic.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {topic.content}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{topic.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(topic.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>
                    {topic.replies} {topic.replies === 1 ? "reply" : "replies"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
