import EditProfileForm from "../features/profile/component/EditProfileForm";
import "../features/profile/component/EditProfile.css";

export default function UserProfilePage() {
  return (
    <main className="edit-profile-page">
      <div className="edit-profile-container">
        <EditProfileForm />
      </div>
    </main>
  );
}
