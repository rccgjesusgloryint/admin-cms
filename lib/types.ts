import { Comment } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";

export type UserExternalId = {
  externalId: string;
};
export type UserDetails = {
  name: string | null | undefined;
  email: string;
};

export type CreateMediaType = {
  id?: string;
  type?: string | null;
  name: string;
  link: string;
  externalId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type CarosoulImageType = {
  id: string | number;
  name: string;
  link: string;
};

export type UploadMultipleFiles = {
  key?: string | undefined;
  type?: string | undefined;
  name: string;
  customId?: string | undefined;
  severData?: string | undefined;
  url: string;
}[];

export type CreateEventType = {
  id?: number;
  event: string;
  date?: string[];
  location: string;
  description: {
    eventPosterImage?: string;
    eventDescription?: string;
  };
  monthly: boolean;
};

export type GalleryType = string[];

export type EventType = {
  id: number;
  event: string;
  date?: string[];
  location: string;
  monthly?: boolean;
  description: object | JsonValue;
}[];

export type EventsType = {
  id?: number;
  event: string;
  date?: string[];
  location: string;
  description: EventsDescription;
  monthly?: boolean;
};

type EventsDescription = {
  eventPosterImage: string;
  eventDescription: string;
};

export type EventDetail = {
  eventId?: string;
  eventPosterImage: string;
  eventDescription: string;
};

export type checkIsLiveParams = {
  dayOfWeek: number;
  dayOfMonth: number;
  hours: number;
  mins: number;
  lastSunday: number;
};

export type EventDescription = {
  description: {
    eventPosterImage: string;
    eventDescription?: string;
  };
  location: string;
};

export type GalleryCategoryType = string[];

export type GetAllImages = {
  id: string;
  link: string;
  name: string;
  date: Date;
};

export type SendNewsletterEmailType = {
  email: string;
}[];

export type NewsletterEmail = {
  subject: string;
  content: string;
};

// export type CreateSermon = Prisma.SermonCreateInput;
export type CreateSermon = {
  id?: number;
  videoUrl: string;
  sermonTitle: string;
  thumbnail: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type Tag = {
  id?: number;
  tagName: string;
  sermons?: [];
  sermonId?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

// export type Sermon = {
//   id: number;
//   videoUrl: string;
//   previewImageUrl: string;
//   sermonTitle: string;
//   tags: Tags;
//   createdAt: Date;
//   updatedAt: Date;
// };
export type Sermon = {
  id?: number;
  videoUrl: string;
  sermonTitle: string;
  tags: string[];
  aiBreakdown: string;
  videoTranscript: string;
  summary: string;
  hasNotes: boolean;
  speaker: string;
  sermonResources?: string[];
  thumbnail?: string | null;
  likes?: number | null;
  comments?: Comment[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type Tags = Tag[];

export type EventTrack = {
  id?: string;
  event_type: string;
  event_calls: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogType = {
  id?: string;
  blogTitle: string;
  blogDescription: string;
  blogImage?: string | null;
  blogContent: string;
  blogAuthor?: string;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ContactFormType = {
  name: string;
  email: string;
  message: string;
};

export interface S3Image {
  id?: string;
  type: string;
  filename: string;
  event: string;
  bucket: string;
  url?: string;
  description?: string;
  createdAt?: Date;
}

export type DbImage = S3Image;

export type EventsMedia = {
  id?: number | null;
  event: string;
  date: Date;
  location?: string | null;
  description?: string | null;
  images: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type EventMediaNoId = {
  id?: number;
  event: string;
  date: Date;
  location?: string;
  description?: string;
  images: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type FeedbackNoId = {
  id?: number;
  name: string;
  email?: string;
  category?: string;
  message: string;
  feedbackFrom?: string;
  createdAt?: Date;
};

type YTThumb = {
  url: string;
  width: number;
  height: number;
};

export type YOUTUBE_playlistItem = {
  kind: "youtube#playlistItem";
  etag: string;
  id: string;
  snippet: {
    // YouTube API returns ISO strings, not Date objects:
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: YTThumb;
      medium?: YTThumb;
      high?: YTThumb;
      standard?: YTThumb;
      maxres?: YTThumb;
      [quality: string]: YTThumb | undefined; // keep flexible
    };
    channelTitle: string;
    videoOwnerChannelTitle: string;
    videoOwnerChannelId: string;
    playlistId: string;
    position: number;
    resourceId: {
      kind: string;
      videoId: string;
    };
  };
  contentDetails: {
    videoId: string;
    startAt?: string;
    endAt?: string;
    note?: string;
    videoPublishedAt: string; // also string from API
  };
  status: {
    privacyStatus: string;
  };
};
