import { ProfileFormClean } from '@/components/dashboard/profile-form-clean'

export default function ProfilePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and preferences
        </p>
      </div>
      
      <ProfileFormClean />
    </div>
  )
}