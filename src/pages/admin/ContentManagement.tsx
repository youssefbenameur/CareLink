import { useState } from "react";
import {
  Folder,
  File,
  Search,
  Plus,
  Edit,
  Trash2,
  FolderPlus,
  Info,
  FileText,
  Calendar,
  AlertCircle,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection } from "@/components/ui/animated-section";
import { useToast } from "@/hooks/use-toast";

// Mock data for resources
const mockResources = [
  {
    id: "1",
    title: "Understanding Anxiety",
    type: "article",
    category: "anxiety",
    status: "published",
    author: "Dr. Jane Smith",
    publishedDate: new Date(2025, 2, 15),
    views: 1245,
  },
  {
    id: "2",
    title: "Mindfulness Meditation Guide",
    type: "video",
    category: "meditation",
    status: "published",
    author: "Dr. Michael Chen",
    publishedDate: new Date(2025, 3, 5),
    views: 879,
  },
  {
    id: "3",
    title: "Cognitive Behavioral Therapy Techniques",
    type: "article",
    category: "therapy",
    status: "draft",
    author: "Dr. Sarah Johnson",
    publishedDate: null,
    views: 0,
  },
  {
    id: "4",
    title: "Sleep Hygiene Practices",
    type: "article",
    category: "sleep",
    status: "published",
    author: "Dr. David Wilson",
    publishedDate: new Date(2025, 1, 28),
    views: 657,
  },
  {
    id: "5",
    title: "Stress Management Workshop",
    type: "video",
    category: "stress",
    status: "published",
    author: "Dr. Emily Davis",
    publishedDate: new Date(2025, 3, 10),
    views: 432,
  },
];

// Mock data for FAQs
const mockFaqs = [
  {
    id: "1",
    question: "How secure is my data on CareLink?",
    answer:
      "CareLink uses enterprise-grade encryption for all user data. Your information is stored securely and is only accessible to authorized healthcare professionals involved in your care.",
    category: "security",
    status: "published",
  },
  {
    id: "2",
    question: "Can I talk to a real therapist on CareLink?",
    answer:
      "Yes, CareLink offers access to licensed mental health professionals. You can book appointments for video consultations or chat sessions with qualified therapists.",
    category: "services",
    status: "published",
  },
  {
    id: "3",
    question: "What payment methods are accepted?",
    answer:
      "We accept all major credit cards, PayPal, and HSA/FSA accounts for payment. Some services may also be eligible for insurance coverage.",
    category: "billing",
    status: "published",
  },
];

const ContentManagement = () => {
  const [resources, setResources] = useState<any[]>(mockResources);
  const [faqs, setFaqs] = useState<any[]>(mockFaqs);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResources, setFilteredResources] =
    useState<any[]>(mockResources);
  const [resourceToEdit, setResourceToEdit] = useState<any>(null);
  const { toast } = useToast();

  // Filter resources based on search term
  const handleResourceSearch = (term: string) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredResources(resources);
      return;
    }

    const filtered = resources.filter(
      (resource) =>
        resource.title.toLowerCase().includes(term.toLowerCase()) ||
        resource.author.toLowerCase().includes(term.toLowerCase()) ||
        resource.category.toLowerCase().includes(term.toLowerCase()),
    );

    setFilteredResources(filtered);
  };

  const handleSaveResource = (resource: any) => {
    // In a real implementation, this would update the resource in the database
    if (resource.id) {
      // Update existing resource
      setResources(resources.map((r) => (r.id === resource.id ? resource : r)));
      setFilteredResources(
        filteredResources.map((r) => (r.id === resource.id ? resource : r)),
      );
      toast({
        title: "Resource updated",
        description: "The resource has been successfully updated.",
      });
    } else {
      // Create new resource
      const newResource = {
        ...resource,
        id: Date.now().toString(),
        views: 0,
        publishedDate: resource.status === "published" ? new Date() : null,
      };

      setResources([newResource, ...resources]);
      setFilteredResources([newResource, ...filteredResources]);
      toast({
        title: "Resource created",
        description: "The new resource has been successfully created.",
      });
    }
  };

  const handleDeleteResource = (id: string) => {
    setResources(resources.filter((r) => r.id !== id));
    setFilteredResources(filteredResources.filter((r) => r.id !== id));
    toast({
      title: "Resource deleted",
      description: "The resource has been permanently removed.",
    });
  };

  const handleSaveFaq = (faq: any) => {
    if (faq.id) {
      // Update existing FAQ
      setFaqs(faqs.map((f) => (f.id === faq.id ? faq : f)));
    } else {
      // Create new FAQ
      const newFaq = {
        ...faq,
        id: Date.now().toString(),
      };
      setFaqs([newFaq, ...faqs]);
    }

    toast({
      title: "FAQ saved",
      description: "The FAQ has been successfully saved.",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Content Management
          </h1>
          <p className="text-muted-foreground">
            Manage educational resources and platform content
          </p>
        </div>

        <Tabs defaultValue="resources" className="space-y-6">
          <TabsList>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="resources">
            <AnimatedSection>
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle>Educational Resources</CardTitle>
                    <CardDescription>
                      Manage articles, videos, and other content for users
                    </CardDescription>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Resource</DialogTitle>
                        <DialogDescription>
                          Create a new educational resource for users
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Resource Title</Label>
                          <Input
                            id="title"
                            placeholder="Enter resource title"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="type">Resource Type</Label>
                            <Select>
                              <SelectTrigger id="type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="article">Article</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="audio">Audio</SelectItem>
                                <SelectItem value="infographic">
                                  Infographic
                                </SelectItem>
                                <SelectItem value="pdf">
                                  PDF Document
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select>
                              <SelectTrigger id="category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="anxiety">Anxiety</SelectItem>
                                <SelectItem value="depression">
                                  Depression
                                </SelectItem>
                                <SelectItem value="stress">
                                  Stress Management
                                </SelectItem>
                                <SelectItem value="sleep">Sleep</SelectItem>
                                <SelectItem value="meditation">
                                  Meditation
                                </SelectItem>
                                <SelectItem value="therapy">Therapy</SelectItem>
                                <SelectItem value="general">
                                  General Wellbeing
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="content">Content/Description</Label>
                          <Textarea
                            id="content"
                            placeholder="Enter resource content or description"
                            rows={5}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="author">Author</Label>
                            <Input id="author" placeholder="Resource author" />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select defaultValue="draft">
                              <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">
                                  Published
                                </SelectItem>
                                <SelectItem value="archived">
                                  Archived
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="resourceUrl">Resource URL</Label>
                          <Input
                            id="resourceUrl"
                            placeholder="https://example.com/resource"
                          />
                          <p className="text-sm text-muted-foreground">
                            For external resources or media files
                          </p>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="submit"
                          onClick={() =>
                            handleSaveResource({
                              title: "New Resource", // In a real app, get these from form inputs
                              type: "article",
                              category: "general",
                              status: "draft",
                              author: "Dr. Admin",
                            })
                          }
                        >
                          Save Resource
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search resources..."
                          className="pl-9"
                          value={searchTerm}
                          onChange={(e) => handleResourceSearch(e.target.value)}
                        />
                      </div>

                      <Select defaultValue="all">
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="article">Articles</SelectItem>
                          <SelectItem value="video">Videos</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                          <SelectItem value="pdf">PDFs</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select defaultValue="all">
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {filteredResources.length > 0 ? (
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Author</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Published</TableHead>
                              <TableHead>Views</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredResources.map((resource) => (
                              <TableRow key={resource.id}>
                                <TableCell className="font-medium">
                                  {resource.title}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {resource.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="capitalize">
                                  {resource.category}
                                </TableCell>
                                <TableCell>{resource.author}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={`
                                      ${
                                        resource.status === "published"
                                          ? "bg-green-500"
                                          : resource.status === "draft"
                                            ? "bg-amber-500"
                                            : "bg-gray-500"
                                      }
                                    `}
                                  >
                                    {resource.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {resource.publishedDate
                                    ? resource.publishedDate.toLocaleDateString()
                                    : "Not published"}
                                </TableCell>
                                <TableCell>{resource.views}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() =>
                                            setResourceToEdit(resource)
                                          }
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                          <DialogTitle>
                                            Edit Resource
                                          </DialogTitle>
                                          <DialogDescription>
                                            Update the resource details
                                          </DialogDescription>
                                        </DialogHeader>

                                        {resourceToEdit && (
                                          <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="editTitle">
                                                Resource Title
                                              </Label>
                                              <Input
                                                id="editTitle"
                                                defaultValue={
                                                  resourceToEdit.title
                                                }
                                              />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-2">
                                                <Label htmlFor="editType">
                                                  Resource Type
                                                </Label>
                                                <Select
                                                  defaultValue={
                                                    resourceToEdit.type
                                                  }
                                                >
                                                  <SelectTrigger id="editType">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="article">
                                                      Article
                                                    </SelectItem>
                                                    <SelectItem value="video">
                                                      Video
                                                    </SelectItem>
                                                    <SelectItem value="audio">
                                                      Audio
                                                    </SelectItem>
                                                    <SelectItem value="infographic">
                                                      Infographic
                                                    </SelectItem>
                                                    <SelectItem value="pdf">
                                                      PDF Document
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>

                                              <div className="space-y-2">
                                                <Label htmlFor="editCategory">
                                                  Category
                                                </Label>
                                                <Select
                                                  defaultValue={
                                                    resourceToEdit.category
                                                  }
                                                >
                                                  <SelectTrigger id="editCategory">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="anxiety">
                                                      Anxiety
                                                    </SelectItem>
                                                    <SelectItem value="depression">
                                                      Depression
                                                    </SelectItem>
                                                    <SelectItem value="stress">
                                                      Stress Management
                                                    </SelectItem>
                                                    <SelectItem value="sleep">
                                                      Sleep
                                                    </SelectItem>
                                                    <SelectItem value="meditation">
                                                      Meditation
                                                    </SelectItem>
                                                    <SelectItem value="therapy">
                                                      Therapy
                                                    </SelectItem>
                                                    <SelectItem value="general">
                                                      General Wellbeing
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-2">
                                                <Label htmlFor="editAuthor">
                                                  Author
                                                </Label>
                                                <Input
                                                  id="editAuthor"
                                                  defaultValue={
                                                    resourceToEdit.author
                                                  }
                                                />
                                              </div>

                                              <div className="space-y-2">
                                                <Label htmlFor="editStatus">
                                                  Status
                                                </Label>
                                                <Select
                                                  defaultValue={
                                                    resourceToEdit.status
                                                  }
                                                >
                                                  <SelectTrigger id="editStatus">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="draft">
                                                      Draft
                                                    </SelectItem>
                                                    <SelectItem value="published">
                                                      Published
                                                    </SelectItem>
                                                    <SelectItem value="archived">
                                                      Archived
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        <DialogFooter>
                                          <Button
                                            onClick={() => {
                                              if (resourceToEdit) {
                                                handleSaveResource(
                                                  resourceToEdit,
                                                );
                                              }
                                            }}
                                          >
                                            Save Changes
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>

                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>
                                            Confirm Deletion
                                          </DialogTitle>
                                          <DialogDescription>
                                            Are you sure you want to delete this
                                            resource? This action cannot be
                                            undone.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex items-center gap-2 py-4 text-amber-600">
                                          <AlertCircle className="h-5 w-5" />
                                          <p className="text-sm">
                                            All data associated with this
                                            resource will be permanently
                                            removed.
                                          </p>
                                        </div>
                                        <DialogFooter>
                                          <Button variant="outline">
                                            Cancel
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            onClick={() =>
                                              handleDeleteResource(resource.id)
                                            }
                                          >
                                            Delete Resource
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12 border rounded-md">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">
                          No resources found
                        </h3>
                        <p className="text-muted-foreground mt-1">
                          Try adjusting your search criteria
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => handleResourceSearch("")}
                          className="mt-4"
                        >
                          Clear search
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredResources.length} of {resources.length}{" "}
                    resources
                  </div>

                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </AnimatedSection>
          </TabsContent>

          <TabsContent value="faqs">
            <AnimatedSection>
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                    <CardDescription>
                      Manage FAQ content for the platform
                    </CardDescription>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add FAQ
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New FAQ</DialogTitle>
                        <DialogDescription>
                          Create a new frequently asked question and answer
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="question">Question</Label>
                          <Input
                            id="question"
                            placeholder="Enter the question"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="answer">Answer</Label>
                          <Textarea
                            id="answer"
                            placeholder="Enter the answer"
                            rows={5}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="faqCategory">Category</Label>
                            <Select>
                              <SelectTrigger id="faqCategory">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="services">
                                  Services
                                </SelectItem>
                                <SelectItem value="billing">
                                  Billing & Payments
                                </SelectItem>
                                <SelectItem value="security">
                                  Security & Privacy
                                </SelectItem>
                                <SelectItem value="technical">
                                  Technical Support
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="faqStatus">Status</Label>
                            <Select defaultValue="published">
                              <SelectTrigger id="faqStatus">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="published">
                                  Published
                                </SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          onClick={() =>
                            handleSaveFaq({
                              question: "New FAQ Question", // In a real app, get from form inputs
                              answer: "Answer to the new FAQ",
                              category: "general",
                              status: "published",
                            })
                          }
                        >
                          Save FAQ
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {faqs.map((faq, index) => (
                      <Card key={faq.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base font-medium">
                                Q: {faq.question}
                              </CardTitle>
                              <Badge className="mt-1 capitalize">
                                {faq.category}
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit FAQ</DialogTitle>
                                    <DialogDescription>
                                      Update this frequently asked question
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor={`editQuestion-${faq.id}`}>
                                        Question
                                      </Label>
                                      <Input
                                        id={`editQuestion-${faq.id}`}
                                        defaultValue={faq.question}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor={`editAnswer-${faq.id}`}>
                                        Answer
                                      </Label>
                                      <Textarea
                                        id={`editAnswer-${faq.id}`}
                                        defaultValue={faq.answer}
                                        rows={5}
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`editFaqCategory-${faq.id}`}
                                        >
                                          Category
                                        </Label>
                                        <Select defaultValue={faq.category}>
                                          <SelectTrigger
                                            id={`editFaqCategory-${faq.id}`}
                                          >
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="general">
                                              General
                                            </SelectItem>
                                            <SelectItem value="services">
                                              Services
                                            </SelectItem>
                                            <SelectItem value="billing">
                                              Billing & Payments
                                            </SelectItem>
                                            <SelectItem value="security">
                                              Security & Privacy
                                            </SelectItem>
                                            <SelectItem value="technical">
                                              Technical Support
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`editFaqStatus-${faq.id}`}
                                        >
                                          Status
                                        </Label>
                                        <Select defaultValue={faq.status}>
                                          <SelectTrigger
                                            id={`editFaqStatus-${faq.id}`}
                                          >
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="published">
                                              Published
                                            </SelectItem>
                                            <SelectItem value="draft">
                                              Draft
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </div>

                                  <DialogFooter>
                                    <Button onClick={() => handleSaveFaq(faq)}>
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">
                            A: {faq.answer}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          </TabsContent>

          <TabsContent value="announcements">
            <AnimatedSection>
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle>Platform Announcements</CardTitle>
                    <CardDescription>
                      Create and manage announcements for users
                    </CardDescription>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Announcement
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Announcement</DialogTitle>
                        <DialogDescription>
                          Create a new announcement to display to users
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Announcement Title</Label>
                          <Input id="title" placeholder="Enter title" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            placeholder="Enter the announcement message"
                            rows={5}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="targetUsers">Target Users</Label>
                            <Select defaultValue="all">
                              <SelectTrigger id="targetUsers">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value="patients">
                                  Patients Only
                                </SelectItem>
                                <SelectItem value="doctors">
                                  Doctors Only
                                </SelectItem>
                                <SelectItem value="admins">
                                  Admins Only
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select defaultValue="normal">
                              <SelectTrigger id="priority">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="scheduledTime">Schedule Time</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              id="scheduledTime"
                              type="date"
                              min={new Date().toISOString().split("T")[0]}
                            />
                            <Input type="time" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Leave blank to publish immediately
                          </p>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          onClick={() => {
                            toast({
                              title: "Announcement created",
                              description:
                                "Your announcement has been scheduled.",
                            });
                          }}
                        >
                          Schedule Announcement
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>

                <CardContent>
                  <div className="text-center py-12 border rounded-md">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">
                      No active announcements
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      Create a new announcement to notify users
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Announcement
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        {/* Dialog content same as above */}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ContentManagement;
