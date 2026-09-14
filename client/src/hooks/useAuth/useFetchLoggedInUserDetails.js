import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { profileApi } from "../../features/profile/profileApi";
import { setUser } from "../../features/auth/AuthSlice";

export default function useFetchLoggedInUserDetails() {
  const dispatch = useDispatch();
  useEffect(() => {
    if (!localStorage.getItem("accessToken")) return;
    let active = true;
    profileApi().then((response) => {
      if (!active) return;
      const user = response?.data ?? response;
      if (user) dispatch(setUser(user));
    }).catch(() => {});
    return () => { active = false; };
  }, [dispatch]);
}
