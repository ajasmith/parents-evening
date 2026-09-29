const defaultSchedule = {
  sessionDurationMinutes: 5,
  scheduleStartTime: "16:00",
  scheduleEndTime: "19:30",
};
const defaultTitle = "Parents Evening";
const defaultBackgroundColour = "#2F4183";
const defaultForegroundColour = "#FFFFFF";
const soundEnabledStorageKey = "sessionClock.soundEnabled";
const renderIntervalMilliseconds = 2_000;
const {
  schedule,
  title,
  logoUrl,
  matchLogoColour,
  clockFormat,
  backgroundColour,
  foregroundColour,
  configurationErrors,
} = getConfigFromQueryString();

const currentTime = document.querySelector("#current-time");
const pageTitle = document.querySelector("#page-title");
const titleImage = document.querySelector("#title-image");
const logoColourFlood = document.querySelector("#logo-colour-flood");
const imageError = document.querySelector("#image-error");
const sessionIndicator = document.querySelector(".session-indicator");
const sessionLabel = document.querySelector("#session-label");
const sessionCount = document.querySelector("#session-count");
const sessionDetail = document.querySelector("#session-detail");
const scheduleSummary = document.querySelector("#schedule-summary");
const soundToggle = document.querySelector("#sound-toggle");
const soundStatus = document.querySelector("#sound-status");
const sessionBell = document.querySelector("#session-bell");
const settingsToggle = document.querySelector("#settings-toggle");
const fullscreenToggle = document.querySelector("#fullscreen-toggle");
const presentationStatus = document.querySelector("#presentation-status");
const settingsView = document.querySelector("#settings-view");
const settingsForm = document.querySelector("#settings-form");
const settingsCancel = document.querySelector("#settings-cancel");
const settingsTestBell = document.querySelector("#settings-test-bell");
const settingsError = document.querySelector("#settings-error");
const titleInput = document.querySelector("#title-input");
const logoInput = document.querySelector("#logo-input");
const configurationSelect = document.querySelector("#configuration-select");
const savedConfigurationsStatus = document.querySelector("#saved-configurations-status");
const matchLogoColourInput = document.querySelector("#match-logo-colour-input");
const startInput = document.querySelector("#start-input");
const endInput = document.querySelector("#end-input");
const durationInput = document.querySelector("#duration-input");
const clockFormatInput = document.querySelector("#clock-format-input");
const backgroundColourInput = document.querySelector("#background-colour-input");
const foregroundColourInput = document.querySelector("#foreground-colour-input");

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: clockFormat === "12" ? "numeric" : "2-digit",
  minute: "2-digit",
  hour12: clockFormat === "12",
});

const [startHour, startMinute] = parseTime(schedule.scheduleStartTime);
const [endHour, endMinute] = parseTime(schedule.scheduleEndTime);
const sessionDurationMs = schedule.sessionDurationMinutes * 60 * 1000;
document.documentElement.style.setProperty("--background-colour", backgroundColour);
document.documentElement.style.setProperty("--foreground-colour", foregroundColour);
logoColourFlood.setAttribute("flood-color", foregroundColour);
pageTitle.textContent = title;
document.title = `${title} – Session Clock`;
if (logoUrl) {
  titleImage.src = logoUrl;
  titleImage.hidden = false;
}
titleImage.classList.toggle("title-banner-image--matches-text", matchLogoColour);
scheduleSummary.textContent =
  `${schedule.sessionDurationMinutes}-minute sessions · ` +
  `${formatScheduleTime(schedule.scheduleStartTime)}–` +
  `${formatScheduleTime(schedule.scheduleEndTime)}`;
titleInput.value = title;
logoInput.value = logoUrl;
matchLogoColourInput.checked = matchLogoColour;
startInput.value = schedule.scheduleStartTime;
endInput.value = schedule.scheduleEndTime;
durationInput.value = String(schedule.sessionDurationMinutes);
clockFormatInput.checked = clockFormat === "24";
backgroundColourInput.value = backgroundColour;
foregroundColourInput.value = foregroundColour;
let soundEnabled = loadSoundEnabled();
let lastObservedSessionIndex;
let wakeLock = null;
let presentationModeRequested = false;
let presentationSyncTimer;

function getConfigFromQueryString() {
  const query = new URLSearchParams(window.location.search);
  const schedule = { ...defaultSchedule };
  let title = defaultTitle;
  let logoUrl = "";
  let matchLogoColour = false;
  let clockFormat = "24";
  let backgroundColour = defaultBackgroundColour;
  let foregroundColour = defaultForegroundColour;
  const configurationErrors = [];
  const requestedTitle = query.get("title");
  const requestedLogo = query.get("logo");
  const requestedMatchLogoColour =
    query.get("matchLogoColour") ?? query.get("invertLogo");
  const start = query.get("start");
  const end = query.get("end");
  const duration = query.get("duration");
  const requestedClockFormat = query.get("clock");
  const requestedBackgroundColour = query.get("background");
  const requestedForegroundColour = query.get("foreground");

  if (requestedTitle !== null) {
    const trimmedTitle = requestedTitle.trim();
    if (trimmedTitle.length >= 1 && trimmedTitle.length <= 100) {
      title = trimmedTitle;
    } else {
      configurationErrors.push('“title” must contain 1 to 100 characters.');
    }
  }

  if (requestedLogo) {
    if (isHttpUrl(requestedLogo)) {
      logoUrl = requestedLogo;
    } else {
      configurationErrors.push('“logo” must be an HTTP or HTTPS URL.');
    }
  }

  if (requestedMatchLogoColour !== null) {
    if (requestedMatchLogoColour === "true" || requestedMatchLogoColour === "false") {
      matchLogoColour = requestedMatchLogoColour === "true";
    } else {
      configurationErrors.push(
        '“matchLogoColour” must be either “true” or “false”.',
      );
    }
  }

  if (start !== null) {
    if (isCompactClockTime(start)) {
      schedule.scheduleStartTime = expandClockTime(start);
    } else {
      configurationErrors.push('“start” must use 24-hour HHmm format.');
    }
  }

  if (end !== null) {
    if (isCompactClockTime(end)) {
      schedule.scheduleEndTime = expandClockTime(end);
    } else {
      configurationErrors.push('“end” must use 24-hour HHmm format.');
    }
  }

  if (duration !== null) {
    const parsedDuration = Number(duration);
    if (/^\d+$/.test(duration) && parsedDuration >= 1 && parsedDuration <= 1_440) {
      schedule.sessionDurationMinutes = parsedDuration;
    } else {
      configurationErrors.push('“duration” must be a whole number from 1 to 1440.');
    }
  }

  if (requestedClockFormat !== null) {
    if (requestedClockFormat === "12" || requestedClockFormat === "24") {
      clockFormat = requestedClockFormat;
    } else {
      configurationErrors.push('“clock” must be either “12” or “24”.');
    }
  }

  if (requestedBackgroundColour !== null) {
    if (isRgbHexValue(requestedBackgroundColour)) {
      backgroundColour = `#${requestedBackgroundColour.toUpperCase()}`;
    } else {
      configurationErrors.push('“background” must be a six-digit RGB colour.');
    }
  }

  if (requestedForegroundColour !== null) {
    if (isRgbHexValue(requestedForegroundColour)) {
      foregroundColour = `#${requestedForegroundColour.toUpperCase()}`;
    } else {
      configurationErrors.push('“foreground” must be a six-digit RGB colour.');
    }
  }

  if (
    configurationErrors.length === 0 &&
    minutesSinceMidnight(schedule.scheduleEndTime) <=
      minutesSinceMidnight(schedule.scheduleStartTime)
  ) {
    configurationErrors.push('“end” must be later than “start”.');
  }

  return {
    schedule,
    title,
    logoUrl,
    matchLogoColour,
    clockFormat,
    backgroundColour,
    foregroundColour,
    configurationErrors,
  };
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isCompactClockTime(value) {
  return /^(?:[01]\d|2[0-3])[0-5]\d$/.test(value);
}

function isRgbHexValue(value) {
  return /^[0-9a-f]{6}$/i.test(value);
}

function isCssRgbHexValue(value) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function isSavedConfiguration(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.name === "string" &&
    value.name.length > 0 &&
    typeof value.title === "string" &&
    value.title.length >= 1 &&
    value.title.length <= 100 &&
    typeof value.logoUrl === "string" &&
    isHttpUrl(value.logoUrl) &&
    typeof value.matchLogoColour === "boolean" &&
    typeof value.background === "string" &&
    isCssRgbHexValue(value.background) &&
    typeof value.foreground === "string" &&
    isCssRgbHexValue(value.foreground)
  );
}

async function loadSavedConfigurations() {
  try {
    const response = await fetch("profiles.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const configurations = await response.json();
    if (!Array.isArray(configurations) || !configurations.every(isSavedConfiguration)) {
      throw new Error("The profiles file contains an invalid configuration.");
    }

    const ids = new Set(configurations.map((configuration) => configuration.id));
    if (ids.size !== configurations.length) {
      throw new Error("The profiles file contains duplicate IDs.");
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a school";
    configurationSelect.replaceChildren(placeholder);

    configurations.forEach((configuration) => {
      const option = document.createElement("option");
      option.value = configuration.id;
      option.textContent = configuration.name;
      option.dataset.title = configuration.title;
      option.dataset.logoUrl = configuration.logoUrl;
      option.dataset.matchLogoColour = String(configuration.matchLogoColour);
      option.dataset.background = configuration.background;
      option.dataset.foreground = configuration.foreground;
      configurationSelect.append(option);
    });

    const matchingConfiguration = [...configurationSelect.options].find(
      (option) => option.dataset.logoUrl === logoUrl,
    );
    configurationSelect.value = matchingConfiguration?.value ?? "";
    configurationSelect.disabled = false;
    savedConfigurationsStatus.hidden = true;
    savedConfigurationsStatus.textContent = "";
  } catch (error) {
    console.error("Could not load saved configurations.", error);
    configurationSelect.replaceChildren();
    const unavailableOption = document.createElement("option");
    unavailableOption.textContent = "Saved configurations unavailable";
    configurationSelect.append(unavailableOption);
    configurationSelect.disabled = true;
    savedConfigurationsStatus.textContent =
      "Saved configurations could not be loaded. You can still enter settings manually.";
    savedConfigurationsStatus.hidden = false;
  }
}

function expandClockTime(value) {
  return `${value.slice(0, 2)}:${value.slice(2)}`;
}

function minutesSinceMidnight(value) {
  const [hour, minute] = parseTime(value);
  return hour * 60 + minute;
}

function parseTime(value) {
  return value.split(":").map(Number);
}

function timeOnSameDay(now, hour, minute) {
  const time = new Date(now);
  time.setHours(hour, minute, 0, 0);
  return time;
}

function getScheduleState(now) {
  const start = timeOnSameDay(now, startHour, startMinute);
  const end = timeOnSameDay(now, endHour, endMinute);
  const totalSessions = Math.ceil((end - start) / sessionDurationMs);

  if (now < start) {
    const minutesUntilStart = Math.ceil((start - now) / (60 * 1000));
    return { phase: "before", minutesUntilStart, totalSessions };
  }

  if (now >= end) {
    return { phase: "after", totalSessions };
  }

  const sessionIndex = Math.floor((now - start) / sessionDurationMs);
  const sessionStart = new Date(start.getTime() + sessionIndex * sessionDurationMs);
  const sessionEnd = new Date(
    Math.min(start.getTime() + (sessionIndex + 1) * sessionDurationMs, end.getTime()),
  );

  return {
    phase: "active",
    sessionIndex,
    sessionStart,
    sessionEnd,
    totalSessions,
  };
}

function playBell() {
  sessionBell.currentTime = 0;
  sessionBell.play().catch((error) => {
    soundEnabled = false;
    updateSoundControls(`The bell could not play: ${error.message}`);
  });
}

function loadSoundEnabled() {
  try {
    const storedValue = window.localStorage.getItem(soundEnabledStorageKey);
    return storedValue === null ? true : storedValue === "true";
  } catch (error) {
    console.error("Could not load the session bell preference.", error);
    return true;
  }
}

function saveSoundEnabled() {
  try {
    window.localStorage.setItem(soundEnabledStorageKey, String(soundEnabled));
  } catch (error) {
    console.error("Could not save the session bell preference.", error);
    soundStatus.textContent =
      "The session bell preference could not be saved by this browser.";
  }
}

function updateSoundControls(message) {
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.textContent = soundEnabled ? "Session bell enabled" : "Enable session bell";
  soundToggle.title = soundEnabled ? "Mute session bell" : "Enable session bell";
  soundStatus.textContent =
    message ??
    (soundEnabled
      ? "The bell will play when each new session starts."
      : "Enable sound once so your browser can play the bell automatically.");
}

function setSettingsOpen(isOpen) {
  settingsView.hidden = !isOpen;
  settingsToggle.setAttribute("aria-expanded", String(isOpen));
  settingsToggle.textContent = isOpen ? "Close settings" : "Open settings";
  settingsToggle.title = settingsToggle.textContent;
  settingsError.textContent = "";

  if (isOpen) {
    titleInput.focus();
  }
}

function compactClockTime(value) {
  return value.replace(":", "");
}

function setNonDefaultQueryParameter(searchParams, name, value, defaultValue) {
  if (value === defaultValue) {
    searchParams.delete(name);
  } else {
    searchParams.set(name, value);
  }
}

function formatScheduleTime(value) {
  const [hour, minute] = parseTime(value);
  return timeFormatter.format(timeOnSameDay(new Date(), hour, minute));
}

function formatHoursAndMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  }

  return parts.join(" ");
}

function isBrowserFullscreen() {
  const fullscreenTolerancePixels = 5;
  return (
    Math.abs(window.innerWidth - window.screen.width) <= fullscreenTolerancePixels &&
    Math.abs(window.innerHeight - window.screen.height) <= fullscreenTolerancePixels
  );
}

function isFullscreenActive() {
  return Boolean(document.fullscreenElement) || isBrowserFullscreen();
}

function updatePresentationControls(message = "") {
  const isFullscreen = isFullscreenActive();
  const isManualBrowserFullscreen = isBrowserFullscreen() && !document.fullscreenElement;
  fullscreenToggle.setAttribute("aria-pressed", String(isFullscreen));
  fullscreenToggle.textContent = isManualBrowserFullscreen
    ? "Full screen active; press F11 to exit"
    : isFullscreen
      ? "Exit full screen"
      : "Enter full screen and keep screen awake";
  fullscreenToggle.title = fullscreenToggle.textContent;
  presentationStatus.textContent = message;
}

async function requestWakeLock() {
  if (!navigator.wakeLock) {
    return {
      acquired: false,
      message: "Full screen is active. This browser does not support screen wake lock.",
    };
  }

  try {
    wakeLock = await navigator.wakeLock.request("screen");
    const acquiredLock = wakeLock;
    acquiredLock.addEventListener("release", () => {
      if (wakeLock === acquiredLock) {
        wakeLock = null;
      }

      if (presentationModeRequested && document.visibilityState === "visible") {
        updatePresentationControls("The browser released the screen wake lock.");
      }
    });
    return { acquired: true, message: "Full screen and screen wake lock are active." };
  } catch (error) {
    wakeLock = null;
    return {
      acquired: false,
      message: `Full screen is active, but screen wake lock failed: ${error.message}`,
    };
  }
}

async function releaseWakeLock() {
  const lockToRelease = wakeLock;
  wakeLock = null;

  if (lockToRelease && !lockToRelease.released) {
    await lockToRelease.release();
  }
}

async function enterPresentationMode() {
  if (!document.documentElement.requestFullscreen) {
    updatePresentationControls("Full screen is not supported by this browser.");
    return;
  }

  try {
    await document.documentElement.requestFullscreen();
    if (!document.fullscreenElement) {
      presentationModeRequested = false;
      updatePresentationControls("Full screen closed before screen wake lock could be requested.");
      return;
    }
    presentationModeRequested = true;
    presentationModeRequested = true;
    updatePresentationControls();
  } catch (error) {
    presentationModeRequested = false;
    updatePresentationControls(`Could not enter full screen: ${error.message}`);
  }
}

async function exitPresentationMode() {
  presentationModeRequested = false;

  try {
    await releaseWakeLock();
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    updatePresentationControls("Full screen closed and screen wake lock released.");
  } catch (error) {
    updatePresentationControls(`Could not exit presentation mode: ${error.message}`);
  }
}

async function syncPresentationMode() {
  if (isFullscreenActive()) {
    presentationModeRequested = true;
    updatePresentationControls();

    if (document.visibilityState === "visible" && (!wakeLock || wakeLock.released)) {
      const wakeLockResult = await requestWakeLock();
      updatePresentationControls(wakeLockResult.message);
    }
    return;
  }

  presentationModeRequested = false;
  await releaseWakeLock();
  updatePresentationControls();
}

function render() {
  const now = new Date();
  const state = configurationErrors.length === 0 ? getScheduleState(now) : null;
  currentTime.textContent = timeFormatter.format(now);
  currentTime.dateTime = now.toISOString();

  if (configurationErrors.length > 0) {
    sessionIndicator.dataset.phase = "error";
    sessionLabel.textContent = "Configuration error";
    sessionCount.textContent = "Check URL";
    sessionDetail.textContent = configurationErrors.join(" ");
    scheduleSummary.textContent = "Invalid schedule";
  } else if (state.phase === "before") {
    sessionIndicator.dataset.phase = state.phase;
    sessionLabel.textContent =
      `First session will start in ${formatHoursAndMinutes(state.minutesUntilStart)}`;
    sessionCount.textContent = "";
    sessionDetail.textContent = "";
  } else if (state.phase === "after") {
    sessionIndicator.dataset.phase = state.phase;
    sessionLabel.textContent = "All sessions have finished";
    sessionCount.textContent = "";
    sessionDetail.textContent = "";
  } else {
    sessionIndicator.dataset.phase = state.phase;
    sessionLabel.textContent = "Session started at";
    sessionCount.textContent = timeFormatter.format(state.sessionStart);
    sessionDetail.textContent = `Ends at ${timeFormatter.format(state.sessionEnd)}`;
  }

  const observedSessionIndex =
    configurationErrors.length === 0 && state.phase === "active" ? state.sessionIndex : null;
  const sessionChanged =
    lastObservedSessionIndex !== undefined &&
    observedSessionIndex !== null &&
    observedSessionIndex !== lastObservedSessionIndex;
  const finalSessionEnded =
    lastObservedSessionIndex !== undefined &&
    lastObservedSessionIndex !== null &&
    state.phase === "after";
  if ((sessionChanged || finalSessionEnded) && soundEnabled) {
    playBell();
  }
  lastObservedSessionIndex = observedSessionIndex;
}

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  if (!soundEnabled) {
    sessionBell.pause();
    sessionBell.currentTime = 0;
  }
  updateSoundControls();
  saveSoundEnabled();
});

settingsToggle.addEventListener("click", () => {
  setSettingsOpen(settingsView.hidden);
});

settingsCancel.addEventListener("click", () => {
  setSettingsOpen(false);
});

settingsTestBell.addEventListener("click", () => {
  playBell();
});

function applyConfigurationSelection() {
  if (configurationSelect.value) {
    const selectedConfiguration = configurationSelect.selectedOptions[0];
    titleInput.value = selectedConfiguration.dataset.title;
    logoInput.value = selectedConfiguration.dataset.logoUrl;
    matchLogoColourInput.checked =
      selectedConfiguration.dataset.matchLogoColour === "true";
    backgroundColourInput.value = selectedConfiguration.dataset.background;
    foregroundColourInput.value = selectedConfiguration.dataset.foreground;
  }
}

configurationSelect.addEventListener("input", applyConfigurationSelection);
configurationSelect.addEventListener("change", applyConfigurationSelection);

logoInput.addEventListener("input", () => {
  const matchingConfiguration = [...configurationSelect.options].find(
    (option) => option.dataset.logoUrl === logoInput.value.trim(),
  );
  configurationSelect.value = matchingConfiguration?.value ?? "";
});

fullscreenToggle.addEventListener("click", () => {
  if (document.fullscreenElement) {
    void exitPresentationMode();
  } else if (isBrowserFullscreen()) {
    updatePresentationControls("Press F11 to exit browser full screen.");
  } else {
    void enterPresentationMode();
  }
});

document.addEventListener("fullscreenchange", () => {
  void syncPresentationMode().catch((error) => {
    updatePresentationControls(`Presentation mode update failed: ${error.message}`);
  });
});

window.addEventListener("resize", () => {
  window.clearTimeout(presentationSyncTimer);
  presentationSyncTimer = window.setTimeout(() => {
    void syncPresentationMode().catch((error) => {
      updatePresentationControls(`Presentation mode update failed: ${error.message}`);
    });
  }, 150);
});

document.addEventListener("visibilitychange", () => {
  if (
    document.visibilityState === "visible" &&
    presentationModeRequested &&
    isFullscreenActive() &&
    (!wakeLock || wakeLock.released)
  ) {
    void requestWakeLock().then((result) => {
      updatePresentationControls(result.message);
    });
  }
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  settingsError.textContent = "";

  if (!settingsForm.reportValidity()) {
    return;
  }

  if (minutesSinceMidnight(endInput.value) <= minutesSinceMidnight(startInput.value)) {
    settingsError.textContent = "End time must be later than start time.";
    endInput.focus();
    return;
  }

  const requestedLogo = logoInput.value.trim();
  if (requestedLogo && !isHttpUrl(requestedLogo)) {
    settingsError.textContent = "Logo image must use an HTTP or HTTPS URL.";
    logoInput.focus();
    return;
  }

  const url = new URL(window.location.href);
  setNonDefaultQueryParameter(
    url.searchParams,
    "title",
    titleInput.value.trim(),
    defaultTitle,
  );
  setNonDefaultQueryParameter(
    url.searchParams,
    "start",
    compactClockTime(startInput.value),
    compactClockTime(defaultSchedule.scheduleStartTime),
  );
  setNonDefaultQueryParameter(
    url.searchParams,
    "end",
    compactClockTime(endInput.value),
    compactClockTime(defaultSchedule.scheduleEndTime),
  );
  setNonDefaultQueryParameter(
    url.searchParams,
    "duration",
    durationInput.value,
    String(defaultSchedule.sessionDurationMinutes),
  );
  setNonDefaultQueryParameter(
    url.searchParams,
    "background",
    backgroundColourInput.value.slice(1).toUpperCase(),
    defaultBackgroundColour.slice(1),
  );
  setNonDefaultQueryParameter(
    url.searchParams,
    "foreground",
    foregroundColourInput.value.slice(1).toUpperCase(),
    defaultForegroundColour.slice(1),
  );
  setNonDefaultQueryParameter(
    url.searchParams,
    "clock",
    clockFormatInput.checked ? "24" : "12",
    "24",
  );
  setNonDefaultQueryParameter(url.searchParams, "logo", requestedLogo, "");
  url.searchParams.delete("invertLogo");
  setNonDefaultQueryParameter(
    url.searchParams,
    "matchLogoColour",
    String(matchLogoColourInput.checked),
    "false",
  );
  window.location.assign(url.toString());
});

titleImage.addEventListener("error", () => {
  titleImage.hidden = true;
  imageError.hidden = false;
});

sessionBell.addEventListener("error", () => {
  soundEnabled = false;
  updateSoundControls("The bell audio file could not be loaded.");
});

updateSoundControls();
void loadSavedConfigurations();
void syncPresentationMode().catch((error) => {
  updatePresentationControls(`Presentation mode update failed: ${error.message}`);
});
render();
setInterval(render, renderIntervalMilliseconds);
