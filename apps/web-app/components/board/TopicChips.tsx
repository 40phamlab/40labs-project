import React from 'react';
import { DEFAULT_TOPICS } from '@/config/board';

interface TopicChipsProps {
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
}

export function TopicChips({ selectedTopic, onSelectTopic }: TopicChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
      {DEFAULT_TOPICS.map((topic) => {
        const isSelected = selectedTopic === topic;
        return (
          <button
            key={topic}
            onClick={() => onSelectTopic(topic)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 font-sans ${
              isSelected
                ? 'bg-[#16A34A] text-black font-bold'
                : 'bg-[#121814] border border-white/10 text-gray-300 hover:text-white hover:border-white/20'
            }`}
          >
            {topic}
          </button>
        );
      })}
    </div>
  );
}
