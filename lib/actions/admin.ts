import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAllUsers() {
  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from('auth.users')
    .select('id, email, raw_user_meta_data, role')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return users
}

export async function updateUserRole(userId: string, formData: FormData) {
  const supabase = await createClient()

  const role = formData.get('role') as string

  const { error } = await supabase
    .from('auth.users')
    .update({ role })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    throw new Error('Failed to update user role')
  }

  revalidatePath('/admin')
}

export async function inviteUser(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  if (!email) {
    throw new Error('Email is required')
  }

  const { error } = await supabase.auth.admin.inviteUserByEmail(email)

  if (error) {
    console.error('Error inviting user:', error)
    throw new Error('Failed to invite user')
  }

  revalidatePath('/admin')
}

export async function checkUserRole() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: userData, error } = await supabase
    .from('auth.users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user role:', error)
    return null
  }

  return userData?.role
}
