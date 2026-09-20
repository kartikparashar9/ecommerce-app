import API from "../../api/Api";
import { unwrapApiResponse } from "../utils/apiResponse";
import { requireId } from "../utils/validation";

const data = unwrapApiResponse;

// =====================================================
// GET ALL ADDRESSES
// =====================================================

export const getAddressesApi = async () => {
  const response = await API.get("/address");
  return data(response);
};

// =====================================================
// GET ADDRESS BY ID
// =====================================================

export const getAddressByIdApi = async (addressId) => {
  const id = requireId(addressId, "address ID");
  const response = await API.get(`/address/${encodeURIComponent(id)}`);
  return data(response);
};

// =====================================================
// CREATE ADDRESS
// =====================================================

export const createAddressApi = async (payload) => {
  // If backend requires slash at end
  const response = await API.post("/address", payload);
  return data(response);
};

// =====================================================
// UPDATE ADDRESS
// =====================================================

export const updateAddressApi = async (addressId, payload) => {
  const id = requireId(addressId, "address ID");
  const response = await API.patch(`/address/${encodeURIComponent(id)}`, payload);
  return data(response);
};

// =====================================================
// DELETE ADDRESS
// =====================================================

export const deleteAddressApi = async (addressId) => {
  const id = requireId(addressId, "address ID");
  const response = await API.delete(`/address/${encodeURIComponent(id)}`);
  return data(response);
};

// =====================================================
// SET DEFAULT
// =====================================================

export const setDefaultAddressApi = async (addressId) => {
  const id = requireId(addressId, "address ID");
  const response = await API.patch(
    `/address/${encodeURIComponent(id)}/default`,
  );
  return data(response);
};

export default API;
