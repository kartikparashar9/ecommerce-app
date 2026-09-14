import { useEffect, useState } from "react";

const getTimeRemaining = (targetDate) => {
  const difference = targetDate - new Date().getTime();

  if (difference <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return {
    hours: Math.floor(
      (difference / (1000 * 60 * 60)) % 24
    ),
    minutes: Math.floor(
      (difference / (1000 * 60)) % 60
    ),
    seconds: Math.floor(
      (difference / 1000) % 60
    ),
  };
};

const useCountdown = (durationInHours = 12) => {
  const [targetDate] = useState(
    () =>
      new Date().getTime() +
      durationInHours * 60 * 60 * 1000
  );

  const [time, setTime] = useState(() =>
    getTimeRemaining(targetDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return time;
};

export default useCountdown;