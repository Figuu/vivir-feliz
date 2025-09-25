"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2, UserCheck, Download } from "lucide-react"
import Papa from "papaparse"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { User } from "@/types"

interface BulkActionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedUsers: User[]
  action: 'delete' | 'role-change' | 'export' | null
}

export function BulkActionsDialog({ 
  open, 
  onOpenChange, 
  selectedUsers, 
  action 
}: BulkActionsDialogProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false)
  const [newRole, setNewRole] = React.useState<'USER' | 'ADMIN' | 'SUPER_ADMIN'>('USER')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const response = await fetch('/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete users')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: 'Success',
        description: `Successfully deleted ${data.deletedCount} users`,
      })
      onOpenChange(false)
      setConfirmDialogOpen(false)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete users',
        variant: 'destructive',
      })
    },
  })

  const bulkRoleChangeMutation = useMutation({
    mutationFn: async ({ userIds, role }: { userIds: string[], role: string }) => {
      const response = await fetch('/api/admin/users/bulk-role-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds, role }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change user roles')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: 'Success',
        description: `Successfully updated roles for ${data.updatedCount} users`,
      })
      onOpenChange(false)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change user roles',
        variant: 'destructive',
      })
    },
  })

  const handleBulkDelete = () => {
    const userIds = selectedUsers.map(user => user.id)
    bulkDeleteMutation.mutate(userIds)
  }

  const handleBulkRoleChange = () => {
    const userIds = selectedUsers.map(user => user.id)
    bulkRoleChangeMutation.mutate({ userIds, role: newRole })
  }

  const handleExport = () => {
    const exportData = selectedUsers.map(user => ({
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
    link.setAttribute('download', `selected-users-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: 'Export Complete',
      description: `Exported ${selectedUsers.length} selected users to CSV`,
    })
    onOpenChange(false)
  }

  const renderContent = () => {
    switch (action) {
      case 'delete':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Bulk Delete Users
              </DialogTitle>
              <DialogDescription>
                You are about to delete {selectedUsers.length} users. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Users to be deleted:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedUsers.map(user => (
                    <div key={user.id} className="text-sm text-muted-foreground">
                      {user.name} ({user.email})
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmDialogOpen(true)}
                >
                  Delete {selectedUsers.length} Users
                </Button>
              </div>
            </div>
          </>
        )

      case 'role-change':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Change User Roles
              </DialogTitle>
              <DialogDescription>
                Change the role for {selectedUsers.length} selected users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Role</Label>
                <Select value={newRole} onValueChange={(value: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => setNewRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Users to be updated:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedUsers.map(user => (
                    <div key={user.id} className="text-sm text-muted-foreground">
                      {user.name} ({user.email}) - Current: {user.role}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkRoleChange}
                  disabled={bulkRoleChangeMutation.isPending}
                >
                  {bulkRoleChangeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Roles
                </Button>
              </div>
            </div>
          </>
        )

      case 'export':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Selected Users
              </DialogTitle>
              <DialogDescription>
                Export {selectedUsers.length} selected users to CSV format.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Export will include:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• User ID, Email, Name</li>
                  <li>• Role and permissions</li>
                  <li>• Creation and update dates</li>
                  <li>• {selectedUsers.length} total records</li>
                </ul>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          {renderContent()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedUsers.length} users and all their associated data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete {selectedUsers.length} Users
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}