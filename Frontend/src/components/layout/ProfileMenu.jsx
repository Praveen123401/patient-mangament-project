import { useNavigate } from "react-router-dom";
import { KeyRound, LogOut, User } from "lucide-react";
import { useAuth } from "../../context/useAuth.js";
import Avatar from "../common/Avatar";
import Dropdown from "../common/Dropdown";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = [
    { label: "My profile", icon: <User size={16} />, onClick: () => navigate("/profile") },
    { label: "Change password", icon: <KeyRound size={16} />, onClick: () => navigate("/profile/password") },
    {
      label: "Logout",
      icon: <LogOut size={16} />,
      danger: true,
      onClick: () => {
        logout()
          .catch((error) => console.error("Logout failed:", error))
          .finally(() => navigate("/login"));
      },
    },
  ];

  return (
    <Dropdown
      items={items}
      trigger={
        <button className="profile-btn">
          <Avatar name={user.name} size={34} />
          <span className="profile-text">
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </span>
        </button>
      }
    />
  );
}