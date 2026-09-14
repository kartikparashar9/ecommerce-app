import { createSlice } from "@reduxjs/toolkit";

/* =====================================================
   LOAD AUTH DATA FROM LOCAL STORAGE
===================================================== */

const storedToken = localStorage.getItem("accessToken");
const storedUser = localStorage.getItem("user");

let parsedUser = null;

try {
  parsedUser = storedUser
    ? JSON.parse(storedUser)
    : null;
} catch (error) {
  console.error("Failed to parse stored user:", error);
  localStorage.removeItem("user");
}


/* =====================================================
   INITIAL STATE
===================================================== */

const initialState = {
  user: parsedUser,
  accessToken: storedToken || null,
  isAuthenticated: Boolean(storedToken),
};


/* =====================================================
   AUTH SLICE
===================================================== */

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {

    /* =================================================
       LOGIN
    ================================================= */

    setCredentials: (state, action) => {
      const {
        user,
        accessToken,
      } = action.payload;

      state.user = user || null;
      state.accessToken = accessToken || null;
      state.isAuthenticated = Boolean(
        accessToken
      );

      /* Save token */

      if (accessToken) {
        localStorage.setItem(
          "accessToken",
          accessToken
        );
      }

      /* Save user */

      if (user) {
        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );
      }
    },


    /* =================================================
       UPDATE USER
    ================================================= */

    setUser: (state, action) => {
      state.user = action.payload;

      if (action.payload) {
        localStorage.setItem(
          "user",
          JSON.stringify(action.payload)
        );
      }
    },


    /* =================================================
       LOGOUT
    ================================================= */

    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;

      localStorage.removeItem(
        "accessToken"
      );

      localStorage.removeItem(
        "user"
      );
    },
  },
});


export const {
  setCredentials,
  setUser,
  clearCredentials,
} = authSlice.actions;


export default authSlice.reducer;