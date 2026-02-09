"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { MessageSquare, Send } from "lucide-react";
import { getComments, postComment, type Comment } from "@/lib/comments";

interface CommentsSectionProps {
  resourceType: "draft" | "launch";
  resourceId: string;
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr || "\u2014";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CommentsSection({ resourceType, resourceId }: CommentsSectionProps) {
  const { address } = useAccount();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      const data = await getComments(resourceType, resourceId);
      setComments(data);
    } catch {
      // Silently fail on load — empty state is fine
    } finally {
      setIsLoading(false);
    }
  }, [resourceType, resourceId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handlePost = useCallback(async () => {
    if (!address || !text.trim()) return;
    setIsPosting(true);
    setError(null);
    try {
      const comment = await postComment(resourceType, resourceId, address, text.trim());
      setComments((prev) => [...prev, comment]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsPosting(false);
    }
  }, [address, text, resourceType, resourceId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments
          {comments.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments list */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">
                    {shortenAddress(comment.author)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(comment.timestamp)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{comment.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Input form */}
        {address ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              rows={3}
              disabled={isPosting}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {text.length}/1000
              </span>
              <Button
                size="sm"
                onClick={handlePost}
                disabled={isPosting || !text.trim()}
              >
                {isPosting ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        ) : (
          <div className="text-center space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to comment
            </p>
            <appkit-button balance="hide" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
