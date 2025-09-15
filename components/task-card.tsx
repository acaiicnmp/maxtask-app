import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export interface Task {
  TaskID: string
  Title: string
  DueDate: string | null
  Assignee: {
    id: string
    email: string
    raw_user_meta_data?: Record<string, unknown>
  }[] | null
}

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false
    const today = new Date()
    const dueDate = new Date(dateString)
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate < today
  }

  const getAssigneeName = () => {
    if (!task.Assignee || task.Assignee.length === 0) return "Unassigned"
    if (task.Assignee.length > 1) return "Multiple"
    const assignee = task.Assignee[0]
    if (assignee.raw_user_meta_data && typeof assignee.raw_user_meta_data === 'object' && 'full_name' in assignee.raw_user_meta_data) {
      return String(assignee.raw_user_meta_data.full_name)
    }
    return assignee.email.split('@')[0]
  }

  const getAssigneeInitials = () => {
    const name = getAssigneeName()
    if (name === "Unassigned" || name === "Multiple") return "U"
    if (typeof name === 'string') {
      return name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    }
    return "U"
  }

  const handleClick = () => {
    if (!isDragging) {
      router.push(`/${task.TaskID}`)
    }
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow bg-card border-border"
      onClick={handleClick}
      onMouseDown={() => setIsDragging(false)}
      onMouseMove={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
    >
      <CardContent className="p-4">
        <h3 className="font-semibold text-card-foreground mb-3 text-balance leading-tight hover:text-primary transition-colors">
          {task.Title}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span
              className={`text-sm ${
                isOverdue(task.DueDate) ? "text-destructive font-medium" : "text-muted-foreground"
              }`}
            >
              {formatDate(task.DueDate)}
            </span>
          </div>

          <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
            <AvatarImage src="/placeholder.svg" alt={String(getAssigneeName() || "Assignee")} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {getAssigneeInitials()}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardContent>
    </Card>
  )
}
