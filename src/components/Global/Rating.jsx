import { useState } from "react";
import { Rating } from "@mui/material";
import {
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
} from "@mui/icons-material";

const iconMap = {
  1: { icon: SentimentVeryDissatisfied, color: "error" },
  2: { icon: SentimentDissatisfied, color: "error" },
  3: { icon: SentimentNeutral, color: "warning" },
  4: { icon: SentimentSatisfied, color: "success" },
  5: { icon: SentimentVerySatisfied, color: "success" },
};

export default function CustomRating({ value, onChange, ...rest }) {
  const [hover, setHover] = useState(-1);

  const handleChange = (_, newValue) => {
    if (newValue === null) return;
    onChange(newValue);
  };

  return (
    <Rating
      max={5}
      value={value}
      onChange={handleChange}
      onChangeActive={(_, newHover) => setHover(newHover)}
      IconContainerComponent={({ value: iconValue }) => {
        const { icon: IconComponent, color: activeColor } = iconMap[iconValue];
        const isActive = hover === iconValue || value === iconValue;
        const iconColor = isActive ? activeColor : "disabled";

        return <IconComponent color={iconColor} fontSize="large" />;
      }}
      {...rest}
    />
  );
}
