import React from "react";
import { motion } from "framer-motion";

import maleAvatar from "../../../../../assets/images/male-avatar.jpg";
import femaleAvatar from "../../../../../assets/images/female-avatar.jpg";

const AvatarSelector = ({ selectedAvatar, handleAvatar }) => {
  const avatars = [
    {
      id: "male",
      label: "Male",
      image: maleAvatar,
    },
    {
      id: "female",
      label: "Female",
      image: femaleAvatar,
    },
  ];

  return (
    <div className="avatar-container">
      {avatars.map((avatar) => (
        <motion.div
          key={avatar.id}
          className={`avatar-card ${
            selectedAvatar === avatar.id ? "selected" : ""
          }`}
          whileHover={{
            scale: 1.05,
            rotate: 2,
          }}
          whileTap={{
            scale: 0.95,
          }}
          onClick={() => handleAvatar(avatar.id)}
        >
          <img
            src={avatar.image}
            alt={avatar.label}
          />

          <h4>{avatar.label}</h4>
        </motion.div>
      ))}
    </div>
  );
};

export default AvatarSelector;