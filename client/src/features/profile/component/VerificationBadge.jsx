const VerificationBadge = ({ verified }) => {
  return (
    <div
      className={
        verified
          ? "verification success"
          : "verification pending"
      }
    >
      {verified
        ? "✓ Verified"
        : "Verification Required"}
    </div>
  );
};

export default VerificationBadge;