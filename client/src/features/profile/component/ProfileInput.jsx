const ProfileInput = ({
  label,
  type,
  name,
  value,
  placeholder,
  onChange,
  readOnly,
}) => {
  return (
    <div className="form-group">
      <label>{label}</label>

      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        readOnly={readOnly}
      />
    </div>
  );
};

export default ProfileInput;