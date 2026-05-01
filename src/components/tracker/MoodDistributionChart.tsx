import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';
import { moodTrackerService } from '@/services/moodTracker';

interface MoodDistributionProps {
  moodData: {
    mood: number;
    count: number;
  }[];
}

// Define colors with more professional palette
const COLORS = ['#f87171', '#fbbf24', '#a3e635', '#34d399', '#06b6d4'];

// Custom active shape for better visualization
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#888">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="#333" fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

export const MoodDistributionChart: React.FC<MoodDistributionProps> = ({ moodData }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  
  // Transform data to include translated names
  const chartData = moodData.map(item => ({
    name: moodTrackerService.getMoodText(item.mood),
    value: item.count,
    mood: item.mood
  }));

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  return (
    <div className="w-full h-[300px]">
      <h3 className="text-base font-medium mb-2 ml-4">Mood Distribution</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              onMouseEnter={onPieEnter}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.mood - 1]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} entries`, 'Count']}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: 'none'
              }}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          No data yet
        </div>
      )}
    </div>
  );
};
