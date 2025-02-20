import * as chrono from "chrono-node";

// Function to parse a date string into a Date object
export const parseDateTime = (str: Date | string) => {
  if (str instanceof Date) return str;
  return chrono.nl.parseDate(str);
};

export const formatDateTime = (datetime: Date | string) => {
  return new Date(datetime).toLocaleTimeString("nl", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

export const formatDate = (datetime: Date | string) => {
  return new Date(datetime).toLocaleDateString("nl", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const stripTime = (datetime: Date) => {
  return new Date(datetime.toDateString());
};

export const formatTime = (datetime: Date | string) => {
  return new Date(datetime).toLocaleTimeString("nl", {
    hour: "numeric",
    minute: "numeric",
  });
};

export const stripDate = (datetime: Date) => {
  return new Date(
    0,
    0,
    0,
    datetime.getHours(),
    datetime.getMinutes(),
    datetime.getSeconds(),
    datetime.getMilliseconds(),
  );
};

export const getDateTimeLocal = (timestamp?: Date): string => {
  const d = timestamp ? new Date(timestamp) : new Date();
  if (d.toString() === "Invalid Date") return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split(":")
    .slice(0, 2)
    .join(":");
};

export const getDateLocal = (timestamp?: Date): string => {
  const d = timestamp ? new Date(timestamp) : new Date();
  if (d.toString() === "Invalid Date") return "";
  return (
    new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0] ?? ""
  );
};

export const getTimeLocal = (timestamp?: Date): string => {
  const d = timestamp ? new Date(timestamp) : new Date();
  if (d.toString() === "Invalid Date") return "";
  return (
    new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[1]
      ?.split(":")
      .slice(0, 2)
      .join(":") ?? ""
  );
};
