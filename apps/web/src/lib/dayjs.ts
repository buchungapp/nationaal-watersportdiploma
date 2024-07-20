import dayjs from "dayjs";
import "dayjs/locale/nl";

import customParseFormat from "dayjs/plugin/customParseFormat.js";
import duration from "dayjs/plugin/duration.js";
import isBetween from "dayjs/plugin/isBetween.js";
import isToday from "dayjs/plugin/isToday.js";
import localizedFormat from "dayjs/plugin/localizedFormat.js";
import minmax from "dayjs/plugin/minMax.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import timeZone from "dayjs/plugin/timezone.js";
import toArray from "dayjs/plugin/toArray.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(isToday);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(timeZone);
dayjs.extend(toArray);
dayjs.extend(utc);
dayjs.extend(minmax);
dayjs.extend(duration);

dayjs.locale("nl");

export type Dayjs = dayjs.Dayjs;
export type { ConfigType } from "dayjs";

export default dayjs;
