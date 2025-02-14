import dayjs from "dayjs";

import customParseFormat from "dayjs/plugin/customParseFormat.js";
import isBetween from "dayjs/plugin/isBetween.js";
import isToday from "dayjs/plugin/isToday.js";
import timeZone from "dayjs/plugin/timezone.js";
import toArray from "dayjs/plugin/toArray.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(isToday);
dayjs.extend(timeZone);
dayjs.extend(toArray);
dayjs.extend(utc);

export type Dayjs = dayjs.Dayjs;

export type { ConfigType } from "dayjs";

export default dayjs;
