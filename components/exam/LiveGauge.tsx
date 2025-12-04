'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LiveGaugeProps {
  scores?: number[];
  currentScore: number;
  className?: string;
}

export default function LiveGauge({ scores = [], currentScore, className = '' }: LiveGaugeProps) {
  const chartData = useMemo(() => {
    return scores.slice(-30).map((score, index) => ({
      index,
      score: score * 100,
    }));
  }, [scores]);

  const scoreColor = useMemo(() => {
    if (currentScore >= 0.7) return 'text-success-600';
    if (currentScore >= 0.4) return 'text-warning-600';
    return 'text-danger-600';
  }, [currentScore]);

  const scoreBg = useMemo(() => {
    if (currentScore >= 0.7) return 'bg-success-100';
    if (currentScore >= 0.4) return 'bg-warning-100';
    return 'bg-danger-100';
  }, [currentScore]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Focus Score</h3>
        <div className={`${scoreBg} ${scoreColor} px-3 py-1 rounded-full text-lg font-bold`}>
          {Math.round(currentScore * 100)}%
        </div>
      </div>
      
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="index" 
              hide 
            />
            <YAxis 
              domain={[0, 100]} 
              hide 
            />
            <Tooltip 
              formatter={(value) => `${value}%`}
              labelFormatter={() => 'Focus'}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke={currentScore >= 0.7 ? '#22c55e' : currentScore >= 0.4 ? '#f59e0b' : '#ef4444'}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-3 text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Avg (last 30s):</span>
          <span className="font-semibold">
            {scores.length > 0 
              ? Math.round((scores.slice(-30).reduce((a, b) => a + b, 0) / Math.min(scores.length, 30)) * 100)
              : 0}%
          </span>
        </div>
      </div>
    </div>
  );
}
