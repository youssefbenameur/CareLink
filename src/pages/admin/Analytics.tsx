
import { useState } from 'react';
import { BarChart, PieChart, LineChart, AreaChart } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedSection } from '@/components/ui/animated-section';
import { ResponsiveContainer, LineChart as RechartLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart as RechartBar, Bar, PieChart as RechartPie, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Mock data for charts
const userGrowthData = [
  { name: 'Jan', users: 400 },
  { name: 'Feb', users: 580 },
  { name: 'Mar', users: 800 },
  { name: 'Apr', users: 1200 },
  { name: 'May', users: 1500 },
  { name: 'Jun', users: 1800 },
];

const sessionData = [
  { name: 'Mon', sessions: 35 },
  { name: 'Tue', sessions: 52 },
  { name: 'Wed', sessions: 61 },
  { name: 'Thu', sessions: 48 },
  { name: 'Fri', sessions: 38 },
  { name: 'Sat', sessions: 27 },
  { name: 'Sun', sessions: 24 },
];

const userTypeData = [
  { name: 'Patients', value: 65 },
  { name: 'Doctors', value: 25 },
  { name: 'Admins', value: 10 },
];

const engagementData = [
  { name: 'Week 1', chatbot: 25, videoCall: 10, resources: 12 },
  { name: 'Week 2', chatbot: 30, videoCall: 15, resources: 15 },
  { name: 'Week 3', chatbot: 38, videoCall: 22, resources: 18 },
  { name: 'Week 4', chatbot: 42, videoCall: 28, resources: 24 },
];

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('month');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Platform usage metrics and performance indicators
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              Export
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <AnimatedSection delay={0.1}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">2,345</div>
                <p className="text-xs text-muted-foreground flex items-center pt-1">
                  <span className="text-green-500 mr-1">+12.5%</span> from last month
                </p>
              </CardContent>
            </Card>
          </AnimatedSection>
          
          <AnimatedSection delay={0.2}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">286</div>
                <p className="text-xs text-muted-foreground flex items-center pt-1">
                  <span className="text-red-500 mr-1">-4.3%</span> from last week
                </p>
              </CardContent>
            </Card>
          </AnimatedSection>
          
          <AnimatedSection delay={0.3}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">753</div>
                <p className="text-xs text-muted-foreground flex items-center pt-1">
                  <span className="text-green-500 mr-1">+8.2%</span> from last month
                </p>
              </CardContent>
            </Card>
          </AnimatedSection>
          
          <AnimatedSection delay={0.4}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Chatbot Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">4,271</div>
                <p className="text-xs text-muted-foreground flex items-center pt-1">
                  <span className="text-green-500 mr-1">+16.8%</span> from last month
                </p>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <AnimatedSection>
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New user registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartLine
                        data={userGrowthData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} />
                      </RechartLine>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </AnimatedSection>
              
              <AnimatedSection delay={0.2}>
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle>Session Activity</CardTitle>
                    <CardDescription>Daily active sessions across the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartBar
                        data={sessionData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sessions" fill="#82ca9d" />
                      </RechartBar>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </AnimatedSection>
            </div>
          </TabsContent>
          
          <TabsContent value="users">
            <div className="grid gap-6 md:grid-cols-2">
              <AnimatedSection>
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle>User Distribution</CardTitle>
                    <CardDescription>Breakdown of user types on the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartPie>
                        <Pie
                          data={userTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {userTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartPie>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </AnimatedSection>
              
              <AnimatedSection delay={0.2}>
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle>User Retention</CardTitle>
                    <CardDescription>Rate of returning users over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartLine
                        data={[
                          { month: 'Jan', retention: 75 },
                          { month: 'Feb', retention: 82 },
                          { month: 'Mar', retention: 78 },
                          { month: 'Apr', retention: 85 },
                          { month: 'May', retention: 90 },
                          { month: 'Jun', retention: 92 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="retention" stroke="#FF8042" activeDot={{ r: 8 }} />
                      </RechartLine>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </AnimatedSection>
            </div>
          </TabsContent>
          
          <TabsContent value="engagement">
            <div className="grid gap-6 md:grid-cols-2">
              <AnimatedSection>
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle>Feature Usage</CardTitle>
                    <CardDescription>Most used features on the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartBar
                        data={engagementData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="chatbot" stackId="a" fill="#8884d8" />
                        <Bar dataKey="videoCall" stackId="a" fill="#82ca9d" />
                        <Bar dataKey="resources" stackId="a" fill="#ffc658" />
                      </RechartBar>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </AnimatedSection>
              
              <AnimatedSection delay={0.2}>
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle>Session Duration</CardTitle>
                    <CardDescription>Average time users spend on the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartLine
                        data={[
                          { week: 'W1', duration: 12 },
                          { week: 'W2', duration: 15 },
                          { week: 'W3', duration: 18 },
                          { week: 'W4', duration: 22 },
                          { week: 'W5', duration: 25 },
                          { week: 'W6', duration: 28 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="duration" stroke="#00C49F" activeDot={{ r: 8 }} />
                      </RechartLine>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </AnimatedSection>
            </div>
          </TabsContent>
          
          <TabsContent value="performance">
            <div className="grid gap-6 md:grid-cols-2">
              <AnimatedSection>
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle>System Performance</CardTitle>
                    <CardDescription>Server response times and availability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartLine
                        data={[
                          { hour: '00:00', response: 120, availability: 99.8 },
                          { hour: '04:00', response: 100, availability: 100 },
                          { hour: '08:00', response: 150, availability: 99.9 },
                          { hour: '12:00', response: 180, availability: 99.7 },
                          { hour: '16:00', response: 200, availability: 99.5 },
                          { hour: '20:00', response: 140, availability: 99.9 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="response" stroke="#8884d8" activeDot={{ r: 8 }} name="Response Time (ms)" />
                        <Line yAxisId="right" type="monotone" dataKey="availability" stroke="#82ca9d" name="Availability (%)" />
                      </RechartLine>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </AnimatedSection>
              
              <AnimatedSection delay={0.2}>
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle>Error Rates</CardTitle>
                    <CardDescription>System errors and exceptions over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartBar
                        data={[
                          { day: 'Mon', errors: 5, warnings: 12 },
                          { day: 'Tue', errors: 3, warnings: 8 },
                          { day: 'Wed', errors: 7, warnings: 15 },
                          { day: 'Thu', errors: 2, warnings: 10 },
                          { day: 'Fri', errors: 4, warnings: 9 },
                          { day: 'Sat', errors: 1, warnings: 5 },
                          { day: 'Sun', errors: 0, warnings: 3 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="errors" fill="#FF8042" />
                        <Bar dataKey="warnings" fill="#FFBB28" />
                      </RechartBar>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </AnimatedSection>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
