import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  profile: null,
  loading: false,
  error: null,
  success: false,
};

const profileSlice = createSlice({
  name: "profile",

  initialState,

  reducers: {
    /* =========================================
       PROFILE FETCH START
    ========================================= */

    profileRequest: (state) => {
      state.loading = true;
      state.error = null;
    },

    /* =========================================
       PROFILE FETCH SUCCESS
    ========================================= */

    profileSuccess: (state, action) => {
      state.loading = false;
      state.profile = action.payload;
      state.error = null;
    },

    /* =========================================
       PROFILE FETCH / UPDATE ERROR
    ========================================= */

    profileFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    /* =========================================
       UPDATE PROFILE
    ========================================= */

    updateProfileSuccess: (state, action) => {
      state.loading = false;
      state.profile = {
        ...state.profile,
        ...action.payload,
      };
      state.error = null;
      state.success = true;
    },

    /* =========================================
       RESET SUCCESS
    ========================================= */

    resetProfileSuccess: (state) => {
      state.success = false;
    },

    /* =========================================
       CLEAR PROFILE
    ========================================= */

    clearProfile: (state) => {
      state.profile = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
});

export const {
  profileRequest,
  profileSuccess,
  profileFailure,
  updateProfileSuccess,
  resetProfileSuccess,
  clearProfile,
} = profileSlice.actions;

export default profileSlice.reducer;