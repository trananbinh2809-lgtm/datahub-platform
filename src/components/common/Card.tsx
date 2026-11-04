import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
        rounded-xl shadow-xs transition-all duration-200
        ${hoverable ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({
  size = 'md',
  text,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div
        className={`${sizeMap} rounded-full border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin`}
      />
      {text && (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{text}</p>
      )}
    </div>
  );
};
