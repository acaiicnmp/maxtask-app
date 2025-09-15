import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkUserRole } from './admin'

export async function getTaskDetails(taskId: string) {
  const supabase = await createClient()

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(`
      TaskID,
      Title,
      Description,
      Status,
      Priority,
      DueDate,
      CreatedDate,
      Assignee (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('TaskID', taskId)
    .single()

  if (taskError) {
    console.error('Error fetching task:', taskError)
    return null
  }

  return task
}

export async function getTaskComments(taskId: string) {
  const supabase = await createClient()

  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      CommentID,
      Content,
      CreatedDate,
      UserID (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('TaskID', taskId)
    .order('CreatedDate', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  return comments
}

export async function addComment(taskId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const content = formData.get('content') as string

  if (!content?.trim()) {
    throw new Error('Comment content is required')
  }

  const { error } = await supabase
    .from('comments')
    .insert({
      TaskID: taskId,
      UserID: user.id,
      Content: content.trim()
    })

  if (error) {
    console.error('Error adding comment:', error)
    throw new Error('Failed to add comment')
  }

  revalidatePath(`/${taskId}`)
}

export async function updateTaskStatus(taskId: string, formData: FormData) {
  const supabase = await createClient()

  const status = formData.get('status') as string

  const { error } = await supabase
    .from('tasks')
    .update({ Status: status })
    .eq('TaskID', taskId)

  if (error) {
    console.error('Error updating task status:', error)
    throw new Error('Failed to update task status')
  }

  revalidatePath('/')
  revalidatePath('/kanban')
  revalidatePath(`/${taskId}`)
}

export async function updateTaskPriority(taskId: string, formData: FormData) {
  const supabase = await createClient()

  const priority = formData.get('priority') as string

  const { error } = await supabase
    .from('tasks')
    .update({ Priority: priority })
    .eq('TaskID', taskId)

  if (error) {
    console.error('Error updating task priority:', error)
    throw new Error('Failed to update task priority')
  }

  revalidatePath(`/${taskId}`)
}

export async function getAllTasks() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      TaskID,
      Title,
      Description,
      Status,
      Priority,
      DueDate,
      CreatedDate,
      Assignee (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('Assignee', user.id)
    .order('CreatedDate', { ascending: false })

  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }

  return tasks
}

export async function getTasksByStatus() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { new: [], processing: [], done: [] }
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      TaskID,
      Title,
      Description,
      Status,
      Priority,
      DueDate,
      CreatedDate,
      Assignee (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('Assignee', user.id)
    .neq('Status', 'Archived')
    .order('CreatedDate', { ascending: false })

  if (error) {
    console.error('Error fetching tasks by status:', error)
    return { new: [], processing: [], done: [] }
  }

  const groupedTasks = {
    new: tasks.filter(task => task.Status === 'New'),
    processing: tasks.filter(task => task.Status === 'Processing'),
    done: tasks.filter(task => task.Status === 'Done')
  }

  return groupedTasks
}

export async function getDashboardStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      openTasks: 0,
      overdueTasks: 0,
      dueToday: 0,
      completedTasks: 0
    }
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('Status, DueDate')
    .eq('Assignee', user.id)

  if (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      openTasks: 0,
      overdueTasks: 0,
      dueToday: 0,
      completedTasks: 0
    }
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const stats = {
    openTasks: tasks.filter(task => task.Status === 'New' || task.Status === 'Processing').length,
    overdueTasks: tasks.filter(task => {
      if (!task.DueDate || task.Status === 'Done') return false
      const dueDate = new Date(task.DueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today
    }).length,
    dueToday: tasks.filter(task => {
      if (!task.DueDate || task.Status === 'Done') return false
      const dueDate = new Date(task.DueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() === today.getTime()
    }).length,
    completedTasks: tasks.filter(task => task.Status === 'Done').length
  }

  return stats
}

export async function createTask(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const priority = formData.get('priority') as string
  const dueDate = formData.get('dueDate') as string

  if (!title?.trim()) {
    throw new Error('Task title is required')
  }

  const taskData = {
    Title: title.trim(),
    Description: description?.trim() || null,
    Status: 'New' as const,
    Priority: (priority as 'Normal' | 'Fast' | 'Urgent') || 'Normal',
    Assignee: user.id,
    DueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null,
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select('TaskID')
    .single()

  if (error) {
    console.error('Error creating task:', error)
    throw new Error('Failed to create task')
  }

  revalidatePath('/')
  revalidatePath('/kanban')

  return data
}

export async function archiveTask(taskId: string) {
  const userRole = await checkUserRole()

  if (userRole !== 'maintainer') {
    throw new Error('Only maintainers can archive tasks')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ Status: 'Archived' })
    .eq('TaskID', taskId)

  if (error) {
    console.error('Error archiving task:', error)
    throw new Error('Failed to archive task')
  }

  revalidatePath('/')
  revalidatePath('/kanban')
  revalidatePath(`/${taskId}`)
}

export async function deleteTask(taskId: string) {
  const userRole = await checkUserRole()

  if (userRole !== 'maintainer') {
    throw new Error('Only maintainers can delete tasks')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('TaskID', taskId)

  if (error) {
    console.error('Error deleting task:', error)
    throw new Error('Failed to delete task')
  }

  revalidatePath('/')
  revalidatePath('/kanban')
}
