import API from "../../api/Api";
const data = (r) => r?.data;
export const getAddressesApi = async () => data(await API.get("/addresses"));
export const getAddressByIdApi = async (addressId) => data(await API.get(`/addresses/${addressId}`));
export const createAddressApi = async (payload) => data(await API.post("/addresses", payload));
export const updateAddressApi = async (addressId, payload) => data(await API.put(`/addresses/${addressId}`, payload));
export const deleteAddressApi = async (addressId) => data(await API.delete(`/addresses/${addressId}`));
export const setDefaultAddressApi = async (addressId) => data(await API.patch(`/addresses/${addressId}/default`));
export default API;
