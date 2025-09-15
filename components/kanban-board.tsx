"use client"

import { useState } from "react"
import { updateTaskStatus } from "@/lib/actions/tasks"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TaskCard } from "./task-card"
import { Badge } from "@/components/ui/badge"
import { Task } from "./task-card"

export interface Column {
  id: string
  title: string
  tasks: Task[]
}

interface KanbanBoardProps {
  initialTasks: {
    new: Task[]
    processing: Task[]
    done: Task[]
  }
}

interface SortableTaskCardProps {
  task: Task
}

function SortableTaskCard({ task }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.TaskID })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  )
}

export function KanbanBoard({ initialTasks }: KanbanBoardProps) {
  const initialColumns: Column[] = [
    {
      id: "new",
      title: "New",
      tasks: initialTasks.new,
    },
    {
      id: "processing",
      title: "Processing",
      tasks: initialTasks.processing,
    },
    {
      id: "done",
      title: "Done",
      tasks: initialTasks.done,
    },
  ]

  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const task = findTaskById(active.id as string)
    setActiveTask(task || null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeColumn = findColumnByTaskId(activeId)
    const overColumn = findColumnByTaskId(overId) || findColumnById(overId)

    if (!activeColumn || !overColumn) return

    if (activeColumn.id === overColumn.id) {
      // Same column reordering
      const activeIndex = activeColumn.tasks.findIndex(task => task.TaskID === activeId)
      const overIndex = overColumn.tasks.findIndex(task => task.TaskID === overId)

      if (activeIndex !== -1 && overIndex !== -1) {
        setColumns(columns => {
          return columns.map(column => {
            if (column.id === activeColumn.id) {
              return {
                ...column,
                tasks: arrayMove(column.tasks, activeIndex, overIndex)
              }
            }
            return column
          })
        })
      }
    } else {
      // Moving between columns
      setColumns(columns => {
        const newColumns = [...columns]
        const sourceColumn = newColumns.find(col => col.id === activeColumn.id)
        const destColumn = newColumns.find(col => col.id === overColumn.id)

        if (!sourceColumn || !destColumn) return columns

        const sourceTasks = [...sourceColumn.tasks]
        const destTasks = [...destColumn.tasks]
        const [movedTask] = sourceTasks.splice(sourceColumn.tasks.findIndex(task => task.TaskID === activeId), 1)
        destTasks.splice(destColumn.tasks.findIndex(task => task.TaskID === overId) + 1, 0, movedTask)

        return newColumns.map(column => {
          if (column.id === activeColumn.id) {
            return { ...column, tasks: sourceTasks }
          }
          if (column.id === overColumn.id) {
            return { ...column, tasks: destTasks }
          }
          return column
        })
      })
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) {
      setActiveTask(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) {
      setActiveTask(null)
      return
    }

    const activeColumn = findColumnByTaskId(activeId)
    const overColumn = findColumnByTaskId(overId) || findColumnById(overId)

    if (!activeColumn || !overColumn) {
      setActiveTask(null)
      return
    }

    if (activeColumn.id !== overColumn.id) {
      // Task moved to different column - update status in database
      const newStatus = overColumn.id === 'new' ? 'New' : overColumn.id === 'processing' ? 'Processing' : 'Done'
      
      const formData = new FormData()
      formData.append('status', newStatus)
      
      try {
        await updateTaskStatus(activeId, formData)
      } catch (error) {
        console.error('Failed to update task status:', error)
        // Revert the UI change if server update fails
        setActiveTask(null)
        return
      }

      // Update local state
      setColumns(columns => {
        const newColumns = [...columns]
        const sourceColumn = newColumns.find(col => col.id === activeColumn.id)
        const destColumn = newColumns.find(col => col.id === overColumn.id)

        if (!sourceColumn || !destColumn) return columns

        const sourceTasks = [...sourceColumn.tasks]
        const destTasks = [...destColumn.tasks]
        const [movedTask] = sourceTasks.splice(sourceColumn.tasks.findIndex(task => task.TaskID === activeId), 1)

        // Add to end if dropping on column, or at specific position if dropping on task
        if (findColumnById(overId)) {
          destTasks.push(movedTask)
        } else {
          const overIndex = destColumn.tasks.findIndex(task => task.TaskID === overId)
          destTasks.splice(overIndex + 1, 0, movedTask)
        }

        return newColumns.map(column => {
          if (column.id === activeColumn.id) {
            return { ...column, tasks: sourceTasks }
          }
          if (column.id === overColumn.id) {
            return { ...column, tasks: destTasks }
          }
          return column
        })
      })
    }

    setActiveTask(null)
  }

  function findTaskById(taskId: string): Task | undefined {
    for (const column of columns) {
      const task = column.tasks.find(task => task.TaskID === taskId)
      if (task) return task
    }
    return undefined
  }

  function findColumnByTaskId(taskId: string): Column | undefined {
    return columns.find(column =>
      column.tasks.some(task => task.TaskID === taskId)
    )
  }

  function findColumnById(columnId: string): Column | undefined {
    return columns.find(column => column.id === columnId)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-foreground">{column.title}</h2>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                {column.tasks.length}
              </Badge>
            </div>

            <div className="min-h-[200px]">
              <SortableContext items={column.tasks.map(task => task.TaskID)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {column.tasks.map((task) => (
                    <SortableTaskCard key={task.TaskID} task={task} />
                  ))}
                </div>
              </SortableContext>
            </div>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 scale-105 opacity-90">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
