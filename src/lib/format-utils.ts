// Formatting utilities for display

/**
 * Format a player's full name
 */
export function formatPlayerName(
  firstName: string,
  lastName: string,
  format: "full" | "first-last" | "last-first" | "initials" = "full"
): string {
  switch (format) {
    case "full":
      return `${firstName} ${lastName}`;
    case "first-last":
      return `${firstName} ${lastName}`;
    case "last-first":
      return `${lastName}, ${firstName}`;
    case "initials":
      return `${firstName.charAt(0)}. ${lastName}`;
    default:
      return `${firstName} ${lastName}`;
  }
}

/**
 * Format player name with number
 */
export function formatPlayerWithNumber(
  number: number,
  firstName: string,
  lastName: string
): string {
  return `#${number} ${firstName} ${lastName}`;
}

/**
 * Format a date for display
 */
export function formatDate(
  date: string | Date,
  format: "short" | "medium" | "long" = "medium"
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return "Invalid date";
  }

  switch (format) {
    case "short":
      return d.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
      });
    case "medium":
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    case "long":
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    default:
      return d.toLocaleDateString();
  }
}

/**
 * Format a time for display
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return "Invalid time";
  }

  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format match score
 */
export function formatMatchScore(
  homeSetsWon: number,
  awaySetsWon: number
): string {
  return `${homeSetsWon}-${awaySetsWon}`;
}

/**
 * Format set score
 */
export function formatSetScore(homeScore: number, awayScore: number): string {
  return `${homeScore}-${awayScore}`;
}

/**
 * Format a percentage (0-100)
 */
export function formatPercent(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined) {
    return "-";
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a rating (-1 to 4 scale)
 */
export function formatRating(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined) {
    return "-";
  }
  return value.toFixed(decimals);
}

/**
 * Format match status for display
 */
export function formatMatchStatus(
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
): string {
  switch (status) {
    case "SCHEDULED":
      return "Scheduled";
    case "IN_PROGRESS":
      return "In Progress";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

/**
 * Format match type for display
 */
export function formatMatchType(type: "BEST_OF_3" | "BEST_OF_5"): string {
  return type === "BEST_OF_3" ? "Best of 3" : "Best of 5";
}

/**
 * Format position for display
 */
export function formatPosition(
  position: string | null | undefined
): string {
  if (!position) return "-";

  const positions: Record<string, string> = {
    SETTER: "Setter",
    OUTSIDE_HITTER: "Outside Hitter",
    MIDDLE_BLOCKER: "Middle Blocker",
    OPPOSITE: "Opposite",
    LIBERO: "Libero",
    DEFENSIVE_SPECIALIST: "DS",
  };

  return positions[position] || position;
}

/**
 * Format position abbreviation
 */
export function formatPositionShort(
  position: string | null | undefined
): string {
  if (!position) return "-";

  const positions: Record<string, string> = {
    SETTER: "S",
    OUTSIDE_HITTER: "OH",
    MIDDLE_BLOCKER: "MB",
    OPPOSITE: "OPP",
    LIBERO: "L",
    DEFENSIVE_SPECIALIST: "DS",
  };

  return positions[position] || position;
}

/**
 * Format ordinal number (1st, 2nd, 3rd, etc.)
 */
export function formatOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format set number for display
 */
export function formatSetNumber(setNumber: number): string {
  return `Set ${setNumber}`;
}

/**
 * Pluralize a word based on count
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural || singular + "s"}`;
}

/**
 * Format a duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Truncate a string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + "...";
}
