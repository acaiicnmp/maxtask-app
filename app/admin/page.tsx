import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, UserPlus, Users } from "lucide-react"
import Link from "next/link"
import { getAllUsers, updateUserRole, inviteUser, checkUserRole } from "@/lib/actions/admin"
import { redirect } from "next/navigation"

type User = {
  id: string
  email: string
  raw_user_meta_data: {
    full_name?: string
    avatar_url?: string
  }
  role: string
}

export default async function AdminSettingsPage() {
  const userRole = await checkUserRole()

  if (!userRole || userRole !== 'maintainer') {
    redirect('/')
  }

  const users = await getAllUsers()

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
              <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
              <p className="text-muted-foreground">Manage users and system settings</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold">{users.length}</div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
                <form action={inviteUser} className="flex gap-2">
                  <Input
                    name="email"
                    type="email"
                    placeholder="user@example.com"
                    className="w-64"
                    required
                  />
                  <Button type="submit" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite User
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user: User) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.raw_user_meta_data?.avatar_url || '/placeholder.svg'}
                          alt={user.raw_user_meta_data?.full_name || user.email}
                        />
                        <AvatarFallback>
                          {(user.raw_user_meta_data?.full_name || user.email)
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.raw_user_meta_data?.full_name || 'No name'}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={user.role === 'maintainer' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>

                      <form action={updateUserRole.bind(null, user.id)} className="flex items-center gap-2">
                        <Select name="role" defaultValue={user.role}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="maintainer">Maintainer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="submit" size="sm" variant="outline">
                          Update
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
