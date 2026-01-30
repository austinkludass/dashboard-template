import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { LineChart } from "@mui/x-charts";
import { Box } from "@mui/material";
import { db } from "../../data/firebase";
import dayjs from "dayjs";

const StatsCard = ({ field, color }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      const q = query(
        collection(db, "stats"),
        orderBy("timestamp", "desc"),
        limit(12)
      );

      const snapshot = await getDocs(q);
      const chartData = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          week: dayjs(doc.id).format("MMM D"),
          value: d[field] || 0,
        };
      });
      setData(chartData.reverse());
    };

    fetchStats();
  }, [field]);

  return (
    <Box sx={{ height: "100%" }}>
      <LineChart
        dataset={data}
        xAxis={[{ dataKey: "week", scaleType: "band" }]}
        series={[
          {
            dataKey: "value",
            color: color,
            label: field[0].toUpperCase() + field.slice(1),
          },
        ]}
      />
    </Box>
  );
};

export default StatsCard;
