'use client';

import { Heart, MessageCircle, Repeat2, Share } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface TwitterPost {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
  image?: string;
}

interface TwitterCardProps {
  post: TwitterPost;
  className?: string;
}

export function TwitterCard({ post, className }: TwitterCardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
          <Image
            src={post.avatar}
            alt={post.author}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm truncate">{post.author}</span>
            <span className="text-muted-foreground text-sm truncate">
              @{post.handle}
            </span>
          </div>
          <span className="text-muted-foreground text-xs">{post.timestamp}</span>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Image (if present) */}
      {post.image && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden mb-3 bg-muted">
          <Image
            src={post.image}
            alt="Post image"
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 text-muted-foreground">
        <button className="flex items-center gap-1.5 hover:text-primary transition-colors group">
          <MessageCircle size={16} className="group-hover:fill-primary/20" />
          <span className="text-xs">{post.replies}</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors group">
          <Repeat2 size={16} className="group-hover:fill-green-500/20" />
          <span className="text-xs">{post.retweets}</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors group">
          <Heart size={16} className="group-hover:fill-red-500/20" />
          <span className="text-xs">{post.likes}</span>
        </button>
        <button className="ml-auto hover:text-primary transition-colors">
          <Share size={16} />
        </button>
      </div>
    </div>
  );
}

