import { useEffect, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { getMyProfile, updateMyProfile } from "../AdminApi";
import "./AdminSettingsContent.css";
const AdminSettingsContent = () => {
  const [profile, setProfile] = useState({
      name: "",
      gender: "",
      avatar: "",
      email: "",
      phone: "",
    }),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const r = await getMyProfile();
        const d = r?.data?.data || {};
        setProfile({
          name: d.name || "",
          gender: d.gender || "",
          avatar: d.avatar || "",
          email: d.email || "",
          phone: d.phone || "",
        });
      } catch (e) {
        setError(e?.response?.data?.message || "Unable to load admin profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const save = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateMyProfile({
        name: profile.name,
        gender: profile.gender,
        avatar: profile.avatar,
      });
      alert("Profile updated successfully");
    } catch (e) {
      alert(e?.response?.data?.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return <div className="admin-settings-state">Loading settings...</div>;
  if (error) return <div className="admin-settings-state error">{error}</div>;
  return (
    <div className="admin-settings-content">
      <div>
        <h1>Settings</h1>
        <p>Manage administrator profile settings.</p>
      </div>
      <div className="settings-grid">
        <form className="settings-card" onSubmit={save}>
          <h2>
            <ShieldCheck size={19} /> Admin Profile
          </h2>
          <label>
            Name
            <input
              required
              minLength={2}
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </label>
          <label>
            Email
            <input value={profile.email} disabled />
          </label>
          <label>
            Phone
            <input value={profile.phone || "Not set"} disabled />
          </label>
          <label>
            Gender
            <select
              value={profile.gender}
              onChange={(e) =>
                setProfile({ ...profile, gender: e.target.value })
              }
            >
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Avatar URL
            <input
              value={profile.avatar}
              onChange={(e) =>
                setProfile({ ...profile, avatar: e.target.value })
              }
            />
          </label>
          <button disabled={saving} type="submit">
            <Save size={17} />
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default AdminSettingsContent;
