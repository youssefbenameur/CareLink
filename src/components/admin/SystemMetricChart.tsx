
import { useState, useEffect } from 'react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import systemSettingsService, { SystemMetric } from '@/services/systemSettingsService';
import { useToast } from '@/hooks/use-toast';

interface SystemMetricChartProps {
  title: string;
  category: string;
  color: string;
  valueLabel?: string;
  height?: string | number;
  hoursToFetch?: number;
}

const formatDateForChart = (date: Date) => {
  return format(date, 'HH:mm');
};

const SystemMetricChart = ({ 
  title, 
  category, 
  color, 
  valueLabel = 'Value', 
  height = "180px", 
  hoursToFetch = 24 
}: SystemMetricChartProps) => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await systemSettingsService.getSystemMetrics(category, 30);
        setMetrics(data);
      } catch (error) {
        console.error(`Error loading ${category} metrics:`, error);
        toast({
          title: `Error loading ${title} data`,
          description: "Could not load metrics from the database",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 300000);
    
    return () => {
      clearInterval(interval);
    };
  }, [category, title, toast]);

  const chartData = metrics.map(metric => ({
    time: formatDateForChart(metric.timestamp),
    value: metric.value
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent style={{ height }}>
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : metrics.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip content={<CustomTooltip label={valueLabel} />} />
              <Line type="monotone" dataKey="value" stroke={color} name={valueLabel} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No {title.toLowerCase()} data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md p-2 shadow-md text-xs">
        <p className="font-medium">{`Time: ${payload[0].payload.time}`}</p>
        <p className="text-primary">{`${label}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export default SystemMetricChart;
