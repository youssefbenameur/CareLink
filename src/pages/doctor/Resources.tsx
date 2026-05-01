
import { useState } from 'react';
import DoctorLayout from '@/components/layout/DoctorLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Plus, FileText, BarChart, Clock, FileUp, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Resources = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceType, setNewResourceType] = useState('article');
  const [newResourceCategory, setNewResourceCategory] = useState('anxiety');
  const [newResourceDescription, setNewResourceDescription] = useState('');
  const [newResourceContent, setNewResourceContent] = useState('');
  
  const handleCreateResource = () => {
    if (!newResourceTitle || !newResourceType || !newResourceDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Demo implementation - would save to Firebase in complete implementation
    toast({
      title: "Resource Created",
      description: "The resource has been created successfully.",
    });
    
    // Reset form
    setNewResourceTitle('');
    setNewResourceDescription('');
    setNewResourceContent('');
  };
  
  // Mock resources for demonstration
  const mockResources = [
    {
      id: '1',
      title: 'Understanding Anxiety Disorders',
      type: 'article',
      category: 'anxiety',
      description: 'A comprehensive overview of anxiety disorders, symptoms, and treatment options.',
      readingTime: 8,
      views: 1245,
      date: new Date(2024, 1, 15),
      assigned: 14
    },
    {
      id: '2',
      title: 'Deep Breathing Techniques',
      type: 'exercise',
      category: 'stress',
      description: 'Step-by-step guide to deep breathing exercises for stress management.',
      readingTime: 5,
      views: 980,
      date: new Date(2024, 2, 3),
      assigned: 28
    },
    {
      id: '3',
      title: 'Depression: Signs and Symptoms',
      type: 'article',
      category: 'depression',
      description: 'Learn to recognize the signs of depression in yourself and others.',
      readingTime: 10,
      views: 2100,
      date: new Date(2024, 3, 1),
      assigned: 19
    },
    {
      id: '4',
      title: 'Sleep Hygiene Tips',
      type: 'video',
      category: 'sleep',
      description: 'Practical tips for improving sleep quality and establishing healthy sleep patterns.',
      readingTime: 15,
      views: 1560,
      date: new Date(2024, 3, 10),
      assigned: 7
    }
  ];
  
  const resourceTypes = [
    { value: 'article', label: "Articles" },
    { value: 'video', label: "Videos" },
    { value: 'exercise', label: "Exercises" },
    { value: 'tool', label: "Tools" },
    { value: 'podcast', label: "Podcasts" }
  ];
  
  const resourceCategories = [
    { value: 'anxiety', label: "Anxiety" },
    { value: 'depression', label: "Depression" },
    { value: 'stress', label: "Stress" },
    { value: 'sleep', label: "Sleep" },
    { value: 'mindfulness', label: "Mindfulness" },
    { value: 'relationships', label: "Relationships" }
  ];
  
  const filteredResources = mockResources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
                         
    const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">
            Manage and share resources with your patients
          </p>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              <FileText className="h-4 w-4 mr-2" />
              All Resources
            </TabsTrigger>
            <TabsTrigger value="assigned">
              <Users className="h-4 w-4 mr-2" />
              Most Assigned
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart className="h-4 w-4 mr-2" />
              Resource Statistics
            </TabsTrigger>
            <TabsTrigger value="add">
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>All Resources</CardTitle>
                    <CardDescription>
                      Manage and share resources with your patients
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search resources..."
                        className="pl-8 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Resources</SelectItem>
                        {resourceCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredResources.length > 0 ? (
                    filteredResources.map((resource) => (
                      <div 
                        key={resource.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{resource.title}</span>
                            <Badge variant="outline">
                              {resourceTypes.find(t => t.value === resource.type)?.label || resource.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {resource.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {resource.readingTime} min read
                            </span>
                            <span className="flex items-center">
                              <BarChart className="h-3 w-3 mr-1" />
                              {resource.views} most viewed
                            </span>
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              Assign to Patient: {resource.assigned}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-3 sm:mt-0 sm:ml-4">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            Assign to Patient
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      No resources found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add Resource</CardTitle>
                <CardDescription>
                  Add Resource
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resourceTitle">Title</Label>
                    <Input 
                      id="resourceTitle" 
                      value={newResourceTitle}
                      onChange={(e) => setNewResourceTitle(e.target.value)}
                      placeholder="Enter resource title"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="resourceType">Resource Type</Label>
                      <Select value={newResourceType} onValueChange={setNewResourceType}>
                        <SelectTrigger id="resourceType">
                          <SelectValue placeholder="Select resource type" />
                        </SelectTrigger>
                        <SelectContent>
                          {resourceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="resourceCategory">Category</Label>
                      <Select value={newResourceCategory} onValueChange={setNewResourceCategory}>
                        <SelectTrigger id="resourceCategory">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {resourceCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="resourceDescription">Description</Label>
                    <Textarea 
                      id="resourceDescription" 
                      value={newResourceDescription}
                      onChange={(e) => setNewResourceDescription(e.target.value)}
                      placeholder="Brief description of this resource"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="resourceContent">Content</Label>
                    <Textarea 
                      id="resourceContent" 
                      value={newResourceContent}
                      onChange={(e) => setNewResourceContent(e.target.value)}
                      placeholder="Main content of the resource"
                      rows={10}
                      className="font-mono"
                    />
                  </div>
                  
                  <div>
                    <Label>Attachments</Label>
                    <div className="mt-2">
                      <div className="flex items-center justify-center border-2 border-dashed rounded-md p-6">
                        <div className="text-center">
                          <FileUp className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
                          <p className="text-sm font-medium">Upload a file</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, PDF, MP3, or MP4 up to 50MB
                          </p>
                          <Button variant="outline" size="sm" className="mt-4">
                            Choose File
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleCreateResource}>Add Resource</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="assigned">
            <Card>
              <CardHeader>
                <CardTitle>Most Assigned</CardTitle>
                <CardDescription>
                  Most Assigned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockResources
                    .sort((a, b) => b.assigned - a.assigned)
                    .map((resource) => (
                      <div 
                        key={resource.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{resource.title}</span>
                            <Badge variant="outline">
                              {resourceTypes.find(t => t.value === resource.type)?.label || resource.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {resource.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              <strong>Assigned {resource.assigned} times</strong>
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-3 sm:mt-0">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Resource Statistics</CardTitle>
                <CardDescription>
                  Resource Statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Most Viewed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {mockResources
                          .sort((a, b) => b.views - a.views)
                          .slice(0, 5)
                          .map((resource, index) => (
                            <div key={resource.id} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground w-5 text-right">{index + 1}.</span>
                                <span className="font-medium">{resource.title}</span>
                              </div>
                              <span className="text-sm">{resource.views} views</span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Most Assigned</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {mockResources
                          .sort((a, b) => b.assigned - a.assigned)
                          .slice(0, 5)
                          .map((resource, index) => (
                            <div key={resource.id} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground w-5 text-right">{index + 1}.</span>
                                <span className="font-medium">{resource.title}</span>
                              </div>
                              <span className="text-sm">{resource.assigned} patients</span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  );
};

export default Resources;
