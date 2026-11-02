'use client';

import React from 'react';
import { MessageSquare, Lock } from 'lucide-react';
import { GatedAction } from '@/config/board';

interface CommentsEmptyProps {
  onGatedAction: (action: GatedAction) => void;
}

export function CommentsEmpty({ onGatedAction }: CommentsEmptyProps) {
  return (
    <section className="mt-12 pt-8 border-t border-white/10 flex flex-col gap-6">
      <h3 className="text-xl font-heading font-bold text-white">Discussion</h3>

      <div className="p-6 bg-[#121814] border border-white/10 rounded-[12px] flex flex-col items-center justify-center text-center gap-3">
        <MessageSquare size={24} className="text-gray-500" />
        <p className="text-sm font-sans text-gray-400">No comments yet.</p>
      </div>

      <div
        onClick={() => onGatedAction('comment')}
        className="p-4 bg-[#121814]/80 border border-white/10 rounded-[12px] flex items-center justify-between cursor-pointer hover:border-[#16A34A]/50 transition-all group"
      >
        <span className="text-sm text-gray-500 font-sans group-hover:text-gray-300 transition-colors">
          Sign up to comment...
        </span>
        <div className="p-2 rounded-lg bg-white/5 text-gray-400 group-hover:text-[#16A34A] transition-colors">
          <Lock size={14} />
        </div>
      </div>
    </section>
  );
}
