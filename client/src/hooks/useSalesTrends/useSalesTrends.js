import { useEffect, useState } from "react";
import { getSalesTrends } from "../../features/admin/AdminApi";

const useSalesTrends = () => {
  const [period, setPeriod] = useState("monthly");
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const fetchSalesTrends = async (selectedPeriod = period) => {
    try {
      setLoading(true);
      setError("");

      const response = await getSalesTrends({
        period: selectedPeriod,
      });

      setSalesData(response?.data?.data || []);
    } catch (error) {
      console.error("Sales trends error:", error);
      setError(error?.response?.data?.message || "Unable to load sales trends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesTrends();
  }, [period]);

  return {
    period,
    setPeriod,
    salesData,
    loading,
    error,
    refetch: fetchSalesTrends,
  };
};
export default useSalesTrends;
