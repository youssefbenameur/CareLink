
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { MoodEntry } from '@/services/moodTracker';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, Sector } from 'recharts';

interface PatientMoodsProps {
  moods: MoodEntry[];
}

// Define mood names and colors with more professional palette
const MOOD_NAMES = ['Poor', 'Low', 'Okay', 'Good', 'Great'];
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

export const PatientMoods = ({ moods }: PatientMoodsProps) => {
  const { t } = useTranslation(['moodTracker', 'common']);
  const isMobile = useIsMobile();
  const [activeIndex, setActiveIndex] = useState(0);
  
  const formatDate = (timestamp: Date | Timestamp) => {
    if (timestamp instanceof Timestamp) {
      return format(timestamp.toDate(), 'MMM d');
    }
    return format(timestamp, 'MMM d');
  };

  const chartData = moods.map(mood => ({
    date: formatDate(mood.createdAt),
    mood: mood.mood,
    anxiety: mood.anxietyLevel || 0
  }));

  // Calculate mood distribution for pie chart
  const calculateDistribution = () => {
    const distribution = Array.from({ length: 5 }, (_, i) => ({ mood: i + 1, count: 0 }));
    moods.forEach(entry => {
      const moodIndex = entry.mood - 1;
      if (moodIndex >= 0 && moodIndex < 5) {
        distribution[moodIndex].count += 1;
      }
    });
    return distribution;
  };

  // Transform distribution data for chart
  const distributionData = calculateDistribution().map(item => ({
    name: MOOD_NAMES[item.mood - 1],
    value: item.count,
    mood: item.mood
  }));

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('moodTracker.history', 'Mood History')}</CardTitle>
      </CardHeader>
      <CardContent>
        {moods.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">{t('moodTracker.noData', 'No mood data available')}</p>
        ) : (
          <>
            <Tabs defaultValue="trend" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="trend">Trend Analysis</TabsTrigger>
                <TabsTrigger value="distribution">Mood Distribution</TabsTrigger>
              </TabsList>
              <TabsContent value="trend" className="mt-4">
                <div className="h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={chartData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#888888" 
                        fontSize={12}
                        tickMargin={10}
                      />
                      <YAxis 
                        stroke="#888888" 
                        fontSize={12}
                        domain={[0, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          border: 'none'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="mood" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name={t('moodTracker.mood', 'Mood')}
                        activeDot={{ r: 8 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="anxiety" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name={t('moodTracker.moods.anxious', 'Anxiety')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="distribution" className="mt-4">
                <div className="h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        onMouseEnter={onPieEnter}
                      >
                        {distributionData.map((entry, index) => (
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
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4 mt-6">
              <h4 className="font-semibold text-sm mb-2">Recent Mood Entries</h4>
              {moods.slice(0, 5).map((mood, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg border"
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-medium">
                        {t('moodTracker.mood', 'Mood')}: {MOOD_NAMES[mood.mood - 1]} ({mood.mood}/5)
                      </p>
                      {mood.anxietyLevel && (
                        <p className="text-sm text-muted-foreground">
                          {t('moodTracker.moods.anxious', 'Anxiety')}: {mood.anxietyLevel}/5
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(mood.createdAt)}
                    </span>
                  </div>
                  {mood.notes && (
                    <p className="mt-2 text-sm">{mood.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
