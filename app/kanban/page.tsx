import { KanbanBoard } from "@/components/kanban-board"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { getTasksByStatus } from "@/lib/actions/tasks"

export default async function KanbanPage() {
  const tasksByStatus = await getTasksByStatus()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground mb-2">Kanban Board</h1>
            <p className="text-muted-foreground">
              Drag and drop tasks to organize your workflow
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <KanbanBoard initialTasks={tasksByStatus} />
      </div>
    </div>
  )
}
