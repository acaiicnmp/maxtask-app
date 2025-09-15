import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, Calendar, MessageSquare, Send } from "lucide-react"
import Link from "next/link"
import { getTaskDetails, getTaskComments, addComment, updateTaskStatus, updateTaskPriority, archiveTask, deleteTask } from "@/lib/actions/tasks"
import { checkUserRole } from "@/lib/actions/admin"
import { createClient } from "@/lib/supabase/server"

type User = {
  id: string;
  email: string;
  raw_user_meta_data: {
    full_name?: string;
    avatar_url?: string;
  };
};

const getPriorityBadge = (priority: string) => {
  const variants = {
    Normal: "default",
    Fast: "secondary",
    Urgent: "destructive",
  } as const

  return <Badge variant={variants[priority as keyof typeof variants] || "outline"}>{priority}</Badge>
}

const getStatusBadge = (status: string) => {
  const variants = {
    New: "outline",
    Processing: "secondary",
    Done: "default",
    Archived: "secondary",
  } as const

  return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24) return `${diffInHours} hours ago`
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} days ago`
}

export default async function TaskDetailPage({ params }: { params: { taskId: string } }) {
  const task = await getTaskDetails(params.taskId)
  const comments = await getTaskComments(params.taskId)
  const userRole = await checkUserRole()

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Task Not Found</h1>
          <p className="text-muted-foreground mb-8">The task you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const taskData = {
    id: task.TaskID,
    title: task.Title,
    description: task.Description || '',
    status: task.Status,
    priority: task.Priority,
    assignee: task.Assignee ? {
      id: (task.Assignee as User[])[0].id,
      name: (task.Assignee as User[])[0].raw_user_meta_data?.full_name || (task.Assignee as User[])[0].email || 'Unknown',
      email: (task.Assignee as User[])[0].email,
      avatar: (task.Assignee as User[])[0].raw_user_meta_data?.avatar_url || '/placeholder.svg'
    } : null,
    dueDate: task.DueDate,
    createdDate: task.CreatedDate,
    comments: comments.map(comment => ({
      id: comment.CommentID,
      content: comment.Content,
      user: {
        name: comment.UserID ? ((comment.UserID as User[])[0].raw_user_meta_data?.full_name || (comment.UserID as User[])[0].email || 'Unknown') : 'Unknown',
        avatar: comment.UserID ? ((comment.UserID as User[])[0].raw_user_meta_data?.avatar_url || '/placeholder.svg') : '/placeholder.svg'
      },
      createdDate: comment.CreatedDate
    }))
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Task Details</h1>
              <p className="text-muted-foreground">Task ID: {params.taskId}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Task Information (70% width) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Task Information</CardTitle>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(taskData.priority)}
                    {getStatusBadge(taskData.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Title
                  </label>
                  <Input
                    value={taskData.title}
                    className="text-lg font-semibold"
                    readOnly
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={taskData.description}
                    className="min-h-[120px] resize-none"
                    readOnly
                  />
                </div>

                {/* Assignee */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Assignee
                  </label>
                  {taskData.assignee ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={taskData.assignee.avatar} alt={taskData.assignee.name} />
                        <AvatarFallback>
                          {taskData.assignee.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{taskData.assignee.name}</p>
                        <p className="text-sm text-muted-foreground">{taskData.assignee.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No assignee</p>
                  )}
                </div>

                {/* Due Date and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Due Date
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{taskData.dueDate ? formatDate(taskData.dueDate) : 'No due date'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Priority
                    </label>
                    <form action={updateTaskPriority.bind(null, params.taskId)}>
                      <Select name="priority" defaultValue={taskData.priority} onValueChange={(value) => {
                        const form = document.querySelector('form[action*="update-priority"]') as HTMLFormElement;
                        if (form) {
                          const input = form.querySelector('input[name="priority"]') as HTMLInputElement;
                          if (input) {
                            input.value = value;
                            form.requestSubmit();
                          }
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Fast">Fast</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </form>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Status
                  </label>
                  <form action={async (formData: FormData) => {
                    'use server'
                    await updateTaskStatus(params.taskId, formData)
                  }}>
                    <Select name="status" defaultValue={taskData.status} onValueChange={(value) => {
                      const form = document.querySelector('form[action*="update-status"]') as HTMLFormElement;
                      if (form) {
                        const input = form.querySelector('input[name="status"]') as HTMLInputElement;
                        if (input) {
                          input.value = value;
                          form.requestSubmit();
                        }
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </form>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button>Save Changes</Button>
                  <Button variant="outline">Mark as Complete</Button>
                  {userRole === 'maintainer' && (
                    <>
                      <form action={archiveTask.bind(null, params.taskId)} className="inline">
                        <Button type="submit" variant="outline" className="text-orange-600 hover:text-orange-700">
                          Archive Task
                        </Button>
                      </form>
                      <form action={deleteTask.bind(null, params.taskId)} className="inline" onSubmit={(e) => {
                        if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                          e.preventDefault()
                        }
                      }}>
                        <Button type="submit" variant="destructive">
                          Delete Task
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Comments (30% width) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments ({taskData.comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Comments Feed */}
                <div className="space-y-4 mb-6">
                  {taskData.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                        <AvatarFallback className="text-xs">
                          {comment.user.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(comment.createdDate)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment Form */}
                <div className="border-t pt-4">
                  <form action={addComment.bind(null, params.taskId)} className="space-y-3">
                    <Textarea
                      name="content"
                      placeholder="Add a comment..."
                      className="min-h-[80px] resize-none"
                      required
                    />
                    <Button type="submit" className="w-full flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Post Comment
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
