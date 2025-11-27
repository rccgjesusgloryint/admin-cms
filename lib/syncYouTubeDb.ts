import { createSermon, getAllSermonsInServer } from "@/lib/queries";
import { YOUTUBE_playlistItem } from "@/lib/types";

export const syncYouTubeDb = async (): Promise<void> => {
  // console.log("FUNCTION CALL!!");
  
  // Early return if YouTube API is not configured
  if (!process.env.YOUTUBE_API_BASE_URL || !process.env.YOUTUBE_API_KEY) {
    console.log("⚠️ YouTube API not configured, skipping sync");
    return;
  }
  
  try {
    // STEP 1: Get uploads playlist ID
    const channelRes = await getRequest(
      "channels?forHandle=@rccgjesusgloryinternationa5350",
      process.env.YOUTUBE_API_KEY as string,
      "contentDetails"
    );
    const channelJson = await channelRes.json();
    const playlistId =
      channelJson?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!playlistId) {
      console.warn("⚠️ No uploads playlist found for channel");
      return;
    }

    // STEP 2: Get latest playlist videos
    const playlistRes = await getRequest(
      `playlistItems?playlistId=${playlistId}&maxResults=50`,
      process.env.YOUTUBE_API_KEY as string,
      "contentDetails,id,snippet"
    );
    const playlistJson = await playlistRes.json();
    const snippetsArray = (playlistJson?.items ?? []) as YOUTUBE_playlistItem[];

    // STEP 3: Build set of existing titles
    const sermonsInDb = await getAllSermonsInServer();
    const sermonTitles = new Set(sermonsInDb.map((s) => s.sermonTitle));

    // STEP 4: Compare and store new sermons
    const sermonsToAdd = snippetsArray
      .filter(
        (item) =>
          item.snippet &&
          (item.snippet.title.includes("Study") ||
            item.snippet.title.includes("Sermon")) &&
          !sermonTitles.has(item.snippet.title)
      )
      .map((item) => {
        const s = item.snippet;
        const t = s.thumbnails ?? ({} as any);
        const thumbUrl =
          t.maxres?.url ??
          t.standard?.url ??
          t.high?.url ??
          t.medium?.url ??
          t.default?.url ??
          "";
        return {
          sermonTitle: s.title,
          videoUrl: `https://www.youtube.com/watch?v=${s.resourceId?.videoId}`,
          thumbnail: thumbUrl,
        };
      });

    if (sermonsToAdd.length === 0) {
      console.log("✅ YouTube sync: No new sermons found.");
      return;
    }

    await Promise.all(sermonsToAdd.map((s) => createSermon(s)));

    console.log(`✅ Synced ${sermonsToAdd.length} new sermons from YouTube.`);
  } catch (err) {
    console.error("❌ syncYouTubeDb failed:", err);
  }
};

// Helper: perform YouTube API GET
const getRequest = async (params: string, key: string, part: string) => {
  // ⚠️ NOTE: consider using a server-only base URL var (not NEXT_PUBLIC_) in the future
  const fullYoutubeUrl = `${process.env.YOUTUBE_API_BASE_URL}/${params}&part=${part}&key=${key}`;
  const response = await fetch(fullYoutubeUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store", // optional if you want to ensure fresh data
  });

  return response;
};
