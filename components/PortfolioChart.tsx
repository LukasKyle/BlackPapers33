import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PortfolioData } from '../types';

const data: PortfolioData[] = [
  { date: '01/01', value: 10000 },
  { date: '01/05', value: 12500 },
  { date: '01/10', value: 11800 },
  { date: '01/15', value: 14200 },
  { date: '01/20', value: 13900 },
  { date: '01/25', value: 16800 },
  { date: '02/01', value: 21000 },
];

export const PortfolioChart: React.FC = () => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00ff9d" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#666" 
            tick={{fill: '#666', fontSize: 12}}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#666" 
            tick={{fill: '#666', fontSize: 12}}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value/1000}k`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
            itemStyle={{ color: '#00ff9d' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#00ff9d" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorValue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};