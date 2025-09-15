import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, AlertTriangle, ListTodo, Calendar, FolderOpen, Activity, KanbanSquare, Settings } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { checkUserRole } from "@/lib/actions/admin"
import { getAllTasks, getDashboardStats } from "@/lib/actions/tasks"
import { CreateTaskDialog } from "@/components/create-task-dialog"

const getStatusBadge = (status: string) => {
  const variants = {
    Done: "default",
    Processing: "secondary",
    New: "outline",
  } as const

  return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>
}

export default async function Dashboard() {
  const userRole = await checkUserRole()
  const stats = await getDashboardStats()
  const allTasks = await getAllTasks()

  // Get recent tasks (last 5 updated)
  const recentTasks = allTasks.slice(0, 5).map(task => ({
    id: task.TaskID,
    title: task.Title,
    project: "Project", // For now, using placeholder
    status: task.Status,
    lastUpdated: formatLastUpdated(task.CreatedDate)
  }))

  function formatLastUpdated(dateString: string) {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return "1 day ago"
    if (diffInDays < 7) return `${diffInDays} days ago`

    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Navigation and Theme Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground text-balance">Hello, Alex Johnson! 👋</h1>
            <p className="text-muted-foreground text-lg">Welcome back to your task management dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <CreateTaskDialog />
            <Link href="/kanban">
              <Button variant="outline" className="flex items-center gap-2">
                <KanbanSquare className="h-4 w-4" />
                Kanban Board
              </Button>
            </Link>
            {userRole === 'maintainer' && (
              <Link href="/admin">
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Admin Settings
                </Button>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Open Tasks</CardTitle>
              <ListTodo className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.openTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">Active tasks in progress</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Tasks</CardTitle>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.overdueTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">Need immediate attention</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Due Today</CardTitle>
              <Clock className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.dueToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Due by end of day</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Tasks</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl font-semibold">My Recently Updated Tasks</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4" />
                        Task Title
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Project
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Last Updated
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((task) => (
                    <tr key={task.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-2">
                        <Link href={`/${task.id}`} className="font-medium text-foreground text-pretty hover:text-primary transition-colors">
                          {task.title}
                        </Link>
                      </td>
                      <td className="py-4 px-2">
                        <div className="text-muted-foreground">{task.project}</div>
                      </td>
                      <td className="py-4 px-2">{getStatusBadge(task.status)}</td>
                      <td className="py-4 px-2">
                        <div className="text-muted-foreground text-sm">{task.lastUpdated}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
