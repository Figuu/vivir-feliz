"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, UserX, Mail, User as UserIcon, UserPlus, Edit } from "lucide-react"
import Papa from "papaparse"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DataTable, SortableHeader, createSelectColumn } from "@/components/ui/data-table"
import { CreateUserDialog } from "@/components/dashboard/create-user-dialog"
import { EditUserDialog } from "@/components/dashboard/edit-user-dialog"
import { BulkActionsDialog } from "@/components/dashboard/bulk-actions-dialog"
import { useToast } from "@/hooks/use-toast"
import { User } from "@/types"

interface AdvancedUsersTableProps {
  onUserUpdate?: (userId: string, updates: Partial<User>) => void
  onUserDelete?: (userId: string) => void
}

export function AdvancedUsersTable({ onUserUpdate, onUserDelete }: AdvancedUsersTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false)
  const [bulkAction, setBulkAction] = React.useState<'delete' | 'role-change' | 'export' | null>(null)
  const [selectedUsers, setSelectedUsers] = React.useState<User[]>([])
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch users with React Query
  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      return data.users as User[]
    },
  })

  // Role change mutation
  const roleChangeMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'USER' | 'ADMIN' | 'SUPER_ADMIN' }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update role')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onUserUpdate?.(variables.userId, { role: variables.newRole })
      toast({
        title: 'Success',
        description: `User role updated to ${formatRole(variables.newRole)}`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user role',
        variant: 'destructive',
      })
    },
  })

  // Impersonation mutation
  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to impersonate user')
      }

      return response.json()
    },
    onSuccess: (data) => {
      const targetUser = users.find(u => u.id === data.targetUser.id)
      toast({
        title: 'Impersonation Started',
        description: `Now viewing as ${targetUser?.name || targetUser?.email}`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to impersonate user',
        variant: 'destructive',
      })
    },
  })

  const handleRoleChange = (user: User, newRole: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => {
    roleChangeMutation.mutate({ userId: user.id, newRole })
  }

  const handleImpersonate = (user: User) => {
    impersonateMutation.mutate(user.id)
  }

  const handleUserDelete = async () => {
    if (!selectedUser) return
    
    try {
      // TODO: Implement user delete API
      // For now, just simulate the deletion
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onUserDelete?.(selectedUser.id)
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const handleBulkAction = (action: string, selectedUsers: User[]) => {
    setSelectedUsers(selectedUsers)
    switch (action) {
      case 'delete':
        setBulkAction('delete')
        setBulkDialogOpen(true)
        break
      case 'export':
        setBulkAction('export')
        setBulkDialogOpen(true)
        break
      case 'role-change':
        setBulkAction('role-change')
        setBulkDialogOpen(true)
        break
      default:
        break
    }
  }

  const exportUsers = (usersToExport: User[] = users) => {
    const exportData = usersToExport.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || 'N/A',
      role: user.role,
      created_at: user.createdAt ? format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
      updated_at: user.updatedAt ? format(new Date(user.updatedAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
    }))

    const csv = Papa.unparse(exportData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `users-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: 'Export Complete',
      description: `Exported ${usersToExport.length} users to CSV`,
    })
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'destructive'
      case 'ADMIN': return 'default'
      default: return 'secondary'
    }
  }

  const formatRole = (role: string) => {
    return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  // Generate filter options based on current data
  const roleOptions = React.useMemo(() => {
    const roleCount = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(roleCount).map(([role, count]) => ({
      label: formatRole(role),
      value: role,
      count,
    }))
  }, [users])

  const statusOptions = React.useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const activeCount = users.filter(user => {
      // If no dates, consider as active (new user)
      if (!user.updatedAt && !user.createdAt) return true
      
      const lastActivity = user.updatedAt ? new Date(user.updatedAt) : (user.createdAt ? new Date(user.createdAt) : new Date())
      return lastActivity > thirtyDaysAgo
    }).length
    
    const inactiveCount = users.length - activeCount

    return [
      { label: 'Active (Last 30 days)', value: 'active', count: activeCount },
      { label: 'Inactive (30+ days)', value: 'inactive', count: inactiveCount },
    ]
  }, [users])

  const filters = [
    {
      id: 'role',
      title: 'Role',
      options: roleOptions,
    },
    {
      id: 'status',
      title: 'Activity Status', 
      options: statusOptions,
    },
  ]

  const columns: ColumnDef<User>[] = [
    createSelectColumn<User>(),
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>User</SortableHeader>
      ),
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar || ''} alt={user.name || 'User'} />
              <AvatarFallback>
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.name || 'Unknown User'}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <SortableHeader column={column}>Role</SortableHeader>
      ),
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return (
          <Badge variant={getRoleVariant(role)}>
            {formatRole(role)}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      id: "status",
      accessorFn: (row) => {
        // If no dates are available, consider the user as new/active
        if (!row.updatedAt && !row.createdAt) {
          return 'active'
        }
        
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const lastActivity = row.updatedAt ? new Date(row.updatedAt) : (row.createdAt ? new Date(row.createdAt) : new Date())
        return lastActivity > thirtyDaysAgo ? 'active' : 'inactive'
      },
      header: ({ column }) => (
        <SortableHeader column={column}>Status</SortableHeader>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Created</SortableHeader>
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date | string | null
        if (!date) return <span className="text-muted-foreground">—</span>
        try {
          return format(new Date(date), 'MMM dd, yyyy')
        } catch {
          return <span className="text-muted-foreground">—</span>
        }
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Last Activity</SortableHeader>
      ),
      cell: ({ row }) => {
        const date = row.getValue("updatedAt") as Date | string | null
        const createdAt = row.getValue("createdAt") as Date | string | null
        
        // If no updatedAt, use createdAt
        const displayDate = date || createdAt
        
        if (!displayDate) return <span className="text-muted-foreground">—</span>
        
        try {
          const dateObj = new Date(displayDate)
          const now = new Date()
          const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60)
          
          // Show relative time for recent activity
          if (diffInHours < 1) {
            return <span className="text-green-600">Just now</span>
          } else if (diffInHours < 24) {
            return <span className="text-green-600">Today</span>
          } else if (diffInHours < 48) {
            return <span className="text-blue-600">Yesterday</span>
          } else if (diffInHours < 168) { // 7 days
            const days = Math.floor(diffInHours / 24)
            return <span className="text-blue-600">{days} days ago</span>
          }
          
          return format(dateObj, 'MMM dd, yyyy')
        } catch {
          return <span className="text-muted-foreground">—</span>
        }
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                Copy user ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <EditUserDialog user={user}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </DropdownMenuItem>
              </EditUserDialog>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleRoleChange(user, 'USER')}>
                Set as User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleChange(user, 'ADMIN')}>
                Set as Admin
              </DropdownMenuItem>
              {user.role !== 'SUPER_ADMIN' && (
                <DropdownMenuItem onClick={() => handleRoleChange(user, 'SUPER_ADMIN')}>
                  Set as Super Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleImpersonate(user)}>
                <UserIcon className="mr-2 h-4 w-4" />
                Impersonate User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  setSelectedUser(user)
                  setDeleteDialogOpen(true)
                }}
              >
                <UserX className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor user accounts in your application.
          </p>
        </div>
        <div className="flex space-x-2">
          <CreateUserDialog>
            <Button size="default" className="shadow-sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </CreateUserDialog>
        </div>
      </div>

      <div className="bg-background rounded-lg">
        <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchPlaceholder="Search users by name, email, or role..."
        onExport={() => exportUsers()}
        onBulkAction={handleBulkAction}
        filters={filters}
        enableDateFilter={true}
        />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{selectedUser?.name || selectedUser?.email}</strong>{`'`}s account
              and remove all their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUserDelete}>
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkActionsDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedUsers={selectedUsers}
        action={bulkAction}
      />
    </div>
  )
}