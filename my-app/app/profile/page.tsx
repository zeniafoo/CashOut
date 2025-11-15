import { ProtectedRoute } from "@/components/protected-route"
import { ProfilePage } from "@/components/profile-page"

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  )
}
