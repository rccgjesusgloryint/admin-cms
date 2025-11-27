import { GetAllImages } from "./types";

export function getYoutubeVidId(youtubeUrl: string) {
  // Define regex patterns to extract the video ID
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^&]+)/,
    /youtu\.be\/([^?&]+)/,
  ];

  let videoId = null;
  for (const pattern of patterns) {
    const match = youtubeUrl.match(pattern);
    if (match) {
      videoId = match[1];
      break;
    }
  }

  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  return videoId as string;
}

export function isMobile() {
  const regex =
    /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return regex.test(navigator.userAgent);
}

export function getLastSundayOfTheMonth(
  year: number,
  month: number
): [string, string] {
  if (month < 0 || month > 11) {
    throw new Error("Month must be between 0 (January) and 11 (December).");
  }

  const lastDay = new Date(year, month + 1, 0); // last day of the month
  const dayOfWeek = lastDay.getDay(); // 0 = Sunday
  const lastSundayDate = lastDay.getDate() - dayOfWeek;

  const monthAbbr = lastDay.toLocaleString("default", { month: "short" }); // e.g., "Sep"
  return [monthAbbr, String(lastSundayDate)];
}

export function getLastSundayOfTheMonthNumber(
  year: number,
  month: number
): number {
  if (month < 0 || month > 11) {
    throw new Error("Month must be between 0 (January) and 11 (December).");
  }

  const lastDay = new Date(year, month + 1, 0); // last day of the month
  const dayOfWeek = lastDay.getDay(); // 0 = Sunday
  const lastSundayDate = lastDay.getDate() - dayOfWeek;

  return lastSundayDate;
}

export function getLastSundayOfTheMonthFull(
  year: number,
  month: number
): string {
  if (month < 0 || month > 11) {
    throw new Error("Month must be between 0 (January) and 11 (December).");
  }

  const lastDay = new Date(year, month + 1, 0); // last day of the month
  const dayOfWeek = lastDay.getDay(); // 0 = Sunday
  const lastSundayDate = lastDay.getDate() - dayOfWeek;

  const lastSunday = new Date(year, month, lastSundayDate);
  return lastSunday.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const getCatImages = (category: string, fullArray: GetAllImages[]) => {
  const temp = [] as GetAllImages[];
  fullArray.map((image) => {
    if (image.name === category) {
      temp.push(image);
    }
  });

  return temp;
};

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
