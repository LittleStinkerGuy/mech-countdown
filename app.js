const PERIOD_STARTS = {
  fourth: { hour: 13, minute: 30 },
  seventh: { hour: 14, minute: 0 }
};

// Map JS weekday (0=Sunday) to which period finishes the school day.
const WEEKDAY_PERIOD_BY_DAY = {
  1: 'seventh', // Monday
  2: 'fourth',  // Tuesday
  3: 'seventh', // Wednesday
  4: 'fourth',  // Thursday
  5: 'seventh'  // Friday
};

const WEEKDAY_END = { hour: 21, minute: 0 };
const WEEKEND_WINDOW = {
  start: { hour: 12, minute: 0 },
  end: { hour: 18, minute: 0 }
};
const WEDNESDAY_INDEX = 3;
const DISPLAY_LINES = {
  days: document.getElementById('days'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds')
};

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function withTime(baseDate, time) {
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    time.hour,
    time.minute,
    0,
    0
  );
}

function getWindowForDate(date) {
  const day = date.getDay();
  if (day === 0 || day === 6) {
    return {
      start: withTime(date, WEEKEND_WINDOW.start),
      end: withTime(date, WEEKEND_WINDOW.end)
    };
  }

  const periodKey = WEEKDAY_PERIOD_BY_DAY[day] || 'seventh';
  const start = PERIOD_STARTS[periodKey];
  if (!start) {
    throw new Error(`Missing start time for period: ${periodKey}`);
  }

  return {
    start: withTime(date, start),
    end: withTime(date, WEEKDAY_END)
  };
}

function getLastWednesdayEnd(now) {
  const candidate = startOfDay(now);
  const distance = (candidate.getDay() + 7 - WEDNESDAY_INDEX) % 7;
  candidate.setDate(candidate.getDate() - distance);

  const currentWeekEnd = getWindowForDate(candidate).end;
  if (now >= currentWeekEnd) {
    return currentWeekEnd;
  }

  candidate.setDate(candidate.getDate() - 7);
  return getWindowForDate(candidate).end;
}

function getControlsProgress(now) {
  const anchor = getLastWednesdayEnd(now);
  const cursor = startOfDay(anchor);
  cursor.setDate(cursor.getDate() + 1);

  let fullDays = 0;
  let partialElapsedMs = 0;

  while (cursor <= now) {
    const { start, end } = getWindowForDate(cursor);
    if (now <= start) {
      break;
    }

    if (now >= end) {
      fullDays += 1;
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    partialElapsedMs = now - start;
    break;
  }

  return {
    fullDays,
    partialElapsedMs
  };
}

function timePartsFromMs(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

function updateCounter() {
  const now = new Date();
  const { fullDays, partialElapsedMs } = getControlsProgress(now);
  const { hours, minutes, seconds } = timePartsFromMs(partialElapsedMs);
  DISPLAY_LINES.days.textContent = `${fullDays} DAYS`;
  DISPLAY_LINES.hours.textContent = `${hours} HOURS`;
  DISPLAY_LINES.minutes.textContent = `${minutes} MINUTES`;
  DISPLAY_LINES.seconds.textContent = `${seconds} SECONDS`;
}

updateCounter();
setInterval(updateCounter, 1000);
