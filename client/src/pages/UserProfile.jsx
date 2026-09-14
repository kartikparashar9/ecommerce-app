import EditProfileForm from "../features/profile/component/EditProfileForm";
import "../features/profile/component/EditProfile.css";

const UserProfilePage = () => {
  return (
    <div className="edit-profile-page">
      <div className="edit-profile-container">
        <EditProfileForm />
      </div>
    </div>
  );
};

export default UserProfilePage;