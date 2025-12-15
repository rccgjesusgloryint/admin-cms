"use server";

import {
  BlogType,
  CarosoulImageType,
  ContactFormType,
  CreateEventType,
  CreateSermon,
  DbImage,
  EventMediaNoId,
  EventsType,
  FeedbackNoId,
  GetTranscriptOptions,
  NewsletterEmail,
  Sermon,
  TranscriptResponse,
  UploadMultipleFiles,
} from "./types";

import { Resend } from "resend";
import { auth } from "@/auth";
import { prisma } from "./db";

import { Blog, EventMedia, Feedback, Image, Media, Role } from "@prisma/client";
import { shuffle } from "./actions";
import { syncYouTubeDb } from "./syncYouTubeDb";

export const allUsers = async () => {
  const res = await prisma.user.findMany({});
  return res;
};

export const findUser = async (userId: string): Promise<string | false> => {
  const res = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
    },
  });
  if (!res?.name) return false;
  return res.name as string;
};

export const isAdmin = async () => {
  const session = await auth();
  if (!session) {
    return false;
  }
  const res = await prisma.user.findUnique({
    where: { id: session.user?.id },
  });

  if (res?.member === "ADMIN" || res?.member === "OWNER") {
    return true;
  } else {
    return false;
  }
};

export const isUserOwner = async () => {
  const session = await auth();
  if (!session) {
    return false;
  }
  const res = await prisma.user.findUnique({
    where: { id: session.user?.id },
  })!!;

  return res?.member === "OWNER";
};

export const accessCheck = async (): Promise<Role | undefined> => {
  const session = await auth();
  if (!session) {
    return undefined;
  }
  const res = await prisma.user.findUnique({
    where: { id: session.user?.id },
  });

  return res?.member;
};

export const getAuthUserDetails = async () => {
  const session = await auth();
  if (!session) {
    return null;
  }
  const userData = await prisma.user.findUnique({
    where: {
      id: session.user?.id,
    },
  });

  return userData;
};

// export const createMedia = async (
//   name: string,
//   mediaFile: UploadMultipleFiles
// ) => {
//   try {
//     for (const link of mediaFile) {
//       try {
//         await prisma.media.create({
//           data: {
//             link: String(`https://kwt4fjtfgo.ufs.sh/f/${link.key}`),
//             name: name,
//           },
//         });

//         // Small delay to prevent overwhelming DB (optional but helps on low limits)
//         await new Promise((resolve) => setTimeout(resolve, 50));
//       } catch (error) {
//         console.error("Error creating media record:", error);
//         return { message: "OOPS COULDN'T UPLOAD SOME FILES", status: 400 };
//       }
//     }

//     return { message: "SUCCESSFULLY UPLOADED FILES", status: 200 };
//   } catch (error) {
//     console.error("Fatal error in createMedia:", error);
//     return { message: "FATAL ERROR UPLOADING FILES", status: 500 };
//   }
// };

// export const deleteMedia = async (mediaId: string) => {
//   const response = await prisma.media.delete({
//     where: {
//       id: mediaId,
//     },
//   });
//   return response;
// };

export const getRandomImages = async (
  amount: number
): Promise<CarosoulImageType[]> => {
  const takeImages = 60; // tune
  const takeEventSets = 3; // tune

  // Run queries in parallel
  const [images, eventMedia] = await Promise.all([
    prisma.image.findMany({
      select: { id: true, url: true, event: true },
      where: { url: { not: null } },
      orderBy: { createdAt: "desc" },
      take: takeImages,
    }),
    prisma.eventMedia.findMany({
      select: { id: true, images: true, event: true },
      orderBy: { createdAt: "desc" },
      take: takeEventSets,
    }),
  ]);

  // Normalize both sources to a single shape and clean once
  type Raw = { id: number | string; event: string; url: string | null };

  const fromImage: Raw[] = images.map((r) => ({
    id: r.id,
    event: r.event ?? null,
    url: r.url,
  }));

  // Flatten eventMedia.images safely
  const fromEventMedia: Raw[] = eventMedia.flatMap((em) => {
    const imgs = Array.isArray(em.images) ? em.images : [];
    return imgs.map((u) => ({ id: em.id, event: em.event ?? null, url: u }));
  });

  // Clean & de-dupe by URL (drop null/empty)
  const deduped: Raw[] = Array.from(
    new Map(
      [...fromImage, ...fromEventMedia]
        .filter((r) => r.url && r.url.trim() !== "")
        .map((r) => [r.url as string, r]) // key: url
    ).values()
  );

  const randomized = shuffle(deduped).slice(0, amount) as Raw[];

  return randomized.map((r) => ({
    id: r.id,
    link: r.url!, // safe due to filter above
    name: r.event ?? "",
  }));
};

export const createEvent = async (eventObj: CreateEventType) => {
  try {
    await prisma.events.create({
      data: {
        id: eventObj.id,
        event: eventObj.event,
        date: eventObj.date,
        location: eventObj.location,
        description: eventObj.description,
        monthly: eventObj.monthly,
      },
    });

    console.log("SUCCESS CREATING EVENT 🟢🟢");
    return { message: "SUCCESS CREATING EVENT 🟢🟢", status: 200 };
  } catch (error) {
    console.log(`OOPS, PROBLEM CREATING EVENT 🔴🔴 -- ERROR MESSAGE: ${error}`);
    return {
      message: `OOPS, PROBLEM CREATING EVENT 🔴🔴 -- ERROR MESSAGE: ${error}`,
      status: 400,
    };
  }
};

export const getAllEvents = async () => {
  const response = await prisma.events?.findMany({
    select: {
      id: true,
      event: true,
      date: true,
      location: true,
      description: true,
      monthly: true,
    },
  });

  return response;
};

export const getEvent = async (id: number) => {
  const response = await prisma.events.findUnique({
    where: { id: id },
    select: {
      description: true,
      location: true,
    },
  });

  return response;
};

export const getEventById = async (id: number): Promise<EventsType | null> => {
  const response = await prisma.events.findUnique({
    where: { id: id },
  });

  return Object(response) as EventsType;
};

export const sendWelcomeEmail = async (email: string) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // ✅ Step 1: Check if the email already exists
    const existingEmail = await prisma.newsletterEmail.findUnique({
      where: { email },
    });

    if (existingEmail) {
      console.log(`Email already exists`);
      return { message: "This email is already subscribed.", status: 409 };
    }

    // ✅ Step 2: Send the Welcome Email
    const { data, error } = await resend.emails.send({
      from: "Jesus Glory Athy <onboarding@jesusgloryintl.com>",
      to: email,
      subject: "Welcome to Jesus Glory Athy Newsletter! 🌟",
      html: `<!DOCTYPE html>
              <html>
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Welcome to Jesus Glory Athy</title>
                  <style>
                      body {
                          font-family: Arial, sans-serif;
                          background-color: #f4f4f4;
                          margin: 0;
                          padding: 0;
                      }
                      .container {
                          max-width: 600px;
                          margin: 20px auto;
                          background: #ffffff;
                          padding: 20px;
                          border-radius: 8px;
                          box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
                          text-align: center;
                      }
                      .header {
                          background: #0073e6;
                          color: #ffffff;
                          padding: 15px;
                          border-radius: 8px 8px 0 0;
                      }
                      h1 {
                          margin: 0;
                          font-size: 24px;
                      }
                      .content {
                          padding: 20px;
                          color: #333333;
                          font-size: 16px;
                          line-height: 1.6;
                      }
                      .button {
                          display: inline-block;
                          background: #0073e6;
                          color: #ffffff;
                          text-decoration: none;
                          padding: 10px 20px;
                          border-radius: 5px;
                          font-size: 16px;
                          margin-top: 15px;
                      }
                      .footer {
                          font-size: 14px;
                          color: #777777 !important;
                          margin-top: 20px;
                          padding-top: 15px;
                          border-top: 1px solid #eeeeee;
                      }
                      a {
                          color: #0073e6;
                      }
                  </style>
              </head>
              <body>
                  <div class="container">
                      <div class="header">
                          <h1>Welcome to Jesus Glory Athy! 🙌</h1>
                      </div>
                      <div class="content">
                          <p>Thank you for joining the <strong>Jesus Glory Athy Newsletter</strong>! We are so excited to have you as part of our community.</p>
                          <p>You’ll receive inspiring messages, event updates, and faith-filled content straight to your inbox.</p>
                          <a href="${process.env.BASE_URL}/events" class="button">Explore Upcoming Events</a>
                          <p>We pray this journey strengthens your faith and brings blessings to your life.</p>
                      </div>
                      <div class="footer">
                           <p>Want to manage your preferences? <a href="${process.env.BASE_URL}/unsubscribe?email=${email}">Unsubscribe here</a>.</p>
                          <p>May God bless you abundantly! ✨</p>
                      </div>
                  </div>
              </body>
              </html>`,
      headers: {
        "List-Unsubscribe": `<mailto:unsubscribe@jesusgloryintl.com>`,
      },
    });

    if (error) {
      return {
        message: `OOPS, PROBLEM SENDING EMAIL 🔴🔴 :${error}`,
        status: 400,
      };
    }

    // ✅ Step 3: Add Email to Database After Successful Email Sending
    try {
      await prisma.newsletterEmail.create({
        data: { email },
      });
    } catch (error) {
      console.error("Database Error:", error);
      return { message: "Error saving email to database", status: 500 };
    }

    return { message: "SUCCESS SENDING EMAIL 🟢🟢", status: 200 };
  } catch (error) {
    console.error("Unexpected Error:", error);
    return {
      message: `OOPS, PROBLEM SENDING EMAIL 🔴🔴 -- ERROR MESSAGE: ${error}`,
      status: 500,
    };
  }
};

export const addEmailToNewsletter = async (newEmail: string) => {
  const email = await prisma.newsletterEmail.findUnique({
    where: { email: newEmail },
  });

  if (email) {
    console.log("email already exists!");
    return { message: "email already exists!", status: 305 };
  }

  try {
    await prisma.newsletterEmail.create({
      data: { email: newEmail },
    });
    console.log({ message: "SUCCESS SENDING EMAIL 🟢🟢", status: 200 });
    return { message: "SUCCESS SENDING EMAIL 🟢🟢", status: 200 };
  } catch (error) {
    return console.log(error);
  }
};

export const getAllNewsletterEmails = async (): Promise<string[]> => {
  const response = (await prisma.newsletterEmail.findMany({})).map(
    (email) => email.email
  );
  return response;
};

export const deleteNewsletterEmail = async (email: string) => {
  try {
    await prisma.newsletterEmail.delete({
      where: { email },
    });
    return { message: "Subscriber removed successfully", status: 200 };
  } catch (error) {
    console.error("Error deleting newsletter email:", error);
    return { message: "Failed to remove subscriber", status: 400 };
  }
};

export const sendContactEmail = async ({
  email,
  name,
  message,
}: ContactFormType) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const emailHtml = `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Message from contact form</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
                    h1 {
                        margin: 0;
                        font-size: 24px;
                    }
                    .content {
                        padding: 20px;
                        color: #333333;
                        font-size: 16px;
                        line-height: 1.6;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                <div>
                  <h1>${name} is contacting the church from the contact form, here's what they said...</h1>
                </div>
                    <div class="content">
                        <p>${message}</p>
                    </div>
                </div>
            </body>
            </html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${name} <contact@jesusgloryintl.com>`,
      to: "rccgjesusgloryint@gmail.com",
      subject: `From contact form`,
      html: emailHtml,
    });

    if (error) {
      return {
        message: `OOPS, PROBLEM SENDING EMAIL 🔴🔴 :${error}`,
        status: 400,
      };
    }
    return { message: "SUCCESS SENDING EMAIL 🟢🟢", status: 200 };
  } catch (error) {
    console.error("Unexpected Error:", error);
    return {
      message: `OOPS, PROBLEM SENDING EMAIL 🔴🔴 -- ERROR MESSAGE: ${error}`,
      status: 500,
    };
  }
};

// export const sendBulkNewsletterEmail = async (
//   newsletterEmails: NewsletterEmail
// ) => {
//   const resend = new Resend(process.env.PROD_RESEND_API_KEY);

//   if (!newsletterEmails) {
//     return null;
//   }

//   try {
//     await resend.batch.send(
//       newsletterEmails.map(({ subject, email, content }) => {
//         return {
//           from: "Jesus Glory Athy Newsletter <onboarding@resend.dev>",
//           to: [email],
//           subject,
//           text: content,
//           // html: "<h1>it works!</h1>",
//         };
//       })
//     );
//   } catch (error) {
//     console.log("ERROR: ", error);
//   }
// };

export const sendBulkNewsletterEmail = async (
  newsletterEmails: NewsletterEmail
) => {
  const resend = new Resend(process.env.PROD_RESEND_API_KEY);

  const emailHtml = `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Message from contact form</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 1100px;
                        margin: 20px auto;
                        background: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
                    h1 {
                        margin: 0;
                        font-size: 24px;
                    }
                    .content {
                        padding: 20px;
                        color: #333333;
                        font-size: 16px;
                        line-height: 1;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                  <div>
                    <h1>${newsletterEmails.subject}</h1>
                  </div>
                    <div class="content">
                        <p>${newsletterEmails.content}</p>
                    </div>
                </div>
            </body>
            </html>`;

  const emailsFromDb = (await prisma.newsletterEmail.findMany({
    select: { email: true },
  })) as [];

  if (!newsletterEmails || !emailsFromDb) {
    return null;
  }

  const isOwner = await isUserOwner();
  if (isOwner === false) {
    console.log({
      error: 500,
      message:
        "User is not autherised, must have 'Owner' credentials to send newsletters",
    });
    throw new Error(
      "User is not autherised, must have 'Owner' credentials to send newsletters"
    );
  }

  console.log("Error continued!");

  // try {
  //   await resend.batch.send(
  //     emailsFromDb.map(({ email }) => {
  //       return {
  //         from: "Jesus Glory Athy Newsletter <contact@jesusgloryintl.com>",
  //         to: [String(email)],
  //         subject: newsletterEmails.subject,
  //         html: emailHtml,
  //       };
  //     })
  //   );
  // } catch (error) {
  //   console.log("ERROR: ", error);
  // }
};

export const deleteSermon = async (sermonId: number) => {
  try {
    await prisma.sermon.delete({
      where: { id: sermonId },
    });
    console.log({ message: "SUCCESS DELETING SERMON", status: 200 });
    return { message: "SUCCESS DELETING SERMON", status: 200 };
  } catch (error) {
    console.log("🔴🔴 OOPS COULDNT DELETE SERMON -- ", error);
    return {
      message: `🔴🔴 -- ERROR MESSAGE: ${error}`,
      status: 400,
    };
  }
};

export const createSermon = async (sermon: CreateSermon, tags?: string[]) => {
  try {
    await prisma.sermon.create({
      data: {
        videoUrl: sermon.videoUrl,
        videoTranscript: sermon.videoTranscript,
        sermonTitle: sermon.sermonTitle,
        thumbnail: sermon.thumbnail,
        tags: tags && [...tags],
      },
    });
    console.log("SUCCESS CREATING SERMON 🟢🟢");
    return { message: "🟢🟢SUCCESS", status: 200 };
  } catch (error) {
    console.log("🔴🔴 OOPS COULDNT CREATE SERMON -- ", error);
    return {
      message: `🔴🔴 -- ERROR MESSAGE: ${error}`,
      status: 400,
    };
  }
};

export const getAllSermons = async (): Promise<Sermon[]> => {
  await syncYouTubeDb();
  return prisma.sermon.findMany({ orderBy: { createdAt: "desc" } });
};
export const getAllSermonsInServer = async (): Promise<Sermon[]> => {
  return prisma.sermon.findMany({});
};

export const getSermonById = async (id: number): Promise<Sermon> => {
  const response = await prisma.sermon.findUnique({
    where: { id },
  });
  return response as Sermon;
};

export const getExistingTags = async (): Promise<string[]> => {
  try {
    const response = await prisma.sermon.findMany({
      select: {
        tags: true,
      },
    });

    // Flatten the array of arrays and remove duplicates
    const tagsList = response.flatMap((sermon) => sermon.tags);
    const uniqueTags = new Set(tagsList);
    const uniquesTagsLost = Array.from(uniqueTags);

    return uniquesTagsLost;
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
};

export const getAllBlogs = async (): Promise<Blog[]> => {
  const response = await prisma.blog.findMany({});

  return response as Blog[];
};

export const getBlogWithId = async (blogId: string): Promise<Blog> => {
  const response = await prisma.blog.findUnique({ where: { id: blogId } });

  return response as Blog;
};

// TO DO: refactor this to only return an array of categories
export const getBlogCategories = async (): Promise<string[]> => {
  const response = await prisma.blog.findMany({
    select: { category: true },
  });

  let allCategories = [] as string[];

  response.map((blog) => allCategories.push(blog.category));

  return allCategories;
};

export const postBlog = async (blog: BlogType, userId: string | undefined) => {
  if (!userId) return false;
  try {
    await prisma.blog.create({
      data: {
        blogImage: blog.blogImage,
        blogContent: blog.blogContent,
        blogDescription: blog.blogDescription,
        blogTitle: blog.blogTitle,
        category: blog.category,
        blogAuthor: userId,
      },
    });
    console.log("BLOG POSTED 🟢🟢");
    return { message: "🟢🟢SUCCESS", status: 200 };
  } catch (error) {
    console.log("🔴🔴 OOPS COULDNT POST BLOG -- ", error);
    return {
      message: `🔴🔴 -- ERROR MESSAGE: ${error}`,
      status: 400,
    };
  }
};

export const deleteBlog = async (blogId: string) => {
  try {
    await prisma.blog.delete({
      where: { id: blogId },
    });
    console.log({ message: "SUCCESS DELETING BLOG", status: 200 });
    return { message: "SUCCESS DELETING BLOG", status: 200 };
  } catch (error) {
    console.log("🔴🔴 OOPS COULDNT DELETE BLOG -- ", error);
    return {
      message: `🔴🔴 -- ERROR MESSAGE: ${error}`,
      status: 400,
    };
  }
};

export const updateBlog = async (blog: BlogType, blogId: string) => {
  try {
    await prisma.blog.update({
      where: { id: blogId },
      data: blog,
    });
    return { status: 200, message: "Success updating sermon!" };
  } catch (error) {
    console.log(error);
    return { status: 400, message: "Error updating sermon!" };
  }
};

export const getAllUsers = async () => {
  try {
    const response = await prisma.user.findMany({});
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getUserById = async (id: string) => {
  try {
    const response = await prisma.user.findUnique({
      where: { id },
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateUsersRole = async (
  userId: string,
  role: "ADMIN" | "MEMBER" | "OWNER" | "MINISTER"
) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        member: role,
      },
    });
    return { status: 200, message: "Success updating users role!" };
  } catch (error) {
    console.log(error);
    return { status: 400, message: "Error updating users role!" };
  }
};

export const updateSermon = async (sermonId: number, sermon: Sermon) => {
  try {
    await prisma.sermon.update({
      where: { id: sermonId },
      data: sermon,
    });
    return { status: 200, message: "Success updating sermon!" };
  } catch (error) {
    console.log(error);
    return { status: 400, message: "Error updating sermon!" };
  }
};

export const updateEvent = async (eventId: number, event: EventsType) => {
  try {
    await prisma.events.update({
      where: { id: eventId },
      data: event,
    });
    return { status: 200, message: "Success updating event!" };
  } catch (error) {
    console.log(error);
    return { status: 400, message: "Error updating event!" };
  }
};

export const deleteEvent = async (eventId: number) => {
  try {
    await prisma.events.delete({
      where: { id: eventId },
    });
    console.log({ status: 200, message: "Success deleting event!" });
    return { status: 200, message: "Success deleting event!" };
  } catch (error) {
    console.log(error);
    return { status: 400, message: "Error deleting event!" };
  }
};

export const isLive = async (): Promise<boolean> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/youtube`;

    const response = await fetch(url, {
      cache: "no-store",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Live check API data:", data.items);
    return data?.isLive;
  } catch (error) {
    console.error("Error fetching live status:", error);
    return false;
  }
};

export const saveImage = async (file: DbImage) => {
  try {
    const response = await prisma.image.create({
      data: {
        ...file,
      },
    });
    return response;
  } catch (error) {
    console.log("Error: ", error);
  }
};

export const saveEventImages = async (file: EventMediaNoId) => {
  try {
    return await prisma.eventMedia.upsert({
      where: { event: file.event },
      update: {
        // keep latest date/metadata if you want:
        date: file.date,
        location: file.location ?? undefined,
        description: file.description ?? undefined,
        images: { push: file.images }, // append to the array
      },
      create: {
        event: file.event,
        date: file.date,
        location: file.location ?? null,
        description: file.description ?? null,
        images: file.images,
      },
    });
  } catch (err) {
    console.error("saveEventImages error:", err);
    throw err; // IMPORTANT
  }
};

export const getImages = async (): Promise<Image[] | undefined> => {
  try {
    const dbImages = await prisma.image.findMany({});
    return dbImages;
  } catch (error) {
    console.log("Error: ", error);
  }
};

export const getAllImages = async () => {
  const response = await prisma.image.findMany({});
  const detailedResponse = response.map((res) => {
    return {
      id: res.id,
      link: res.url || "",
      name: res.event,
      date: res.createdAt,
    };
  });

  return detailedResponse;
};

export const getAllImagesv2 = async () => {
  const response = await prisma.eventMedia.findMany({});

  return response;
};

/**
 * Fetches a single event gallery by ID with all associated images
 *
 * This function retrieves a specific event's gallery data including:
 * - Event name and description
 * - Date and location information
 * - Array of image URLs
 *
 * @param eventId - The numeric ID of the event to fetch
 * @returns Promise resolving to EventsMedia object or null if not found
 *
 * @example
 * const gallery = await getEventGalleryById(123);
 * if (gallery) {
 *   console.log(gallery.event); // "Easter Celebration"
 *   console.log(gallery.images.length); // 15
 * }
 */
export const getEventGalleryById = async (
  eventId: number
): Promise<EventMedia | null> => {
  try {
    const response = await prisma.eventMedia.findUnique({
      where: { id: eventId },
    });
    return response;
  } catch (error) {
    console.error("Error fetching event gallery:", error);
    return null;
  }
};

export const reportFeedback = async (form: FeedbackNoId) => {
  try {
    return await prisma.feedback.create({
      data: {
        name: form.name ?? null,
        email: form.email ?? null,
        category: form.category ?? null,
        message: form.message,
        feedbackFrom: form.feedbackFrom ?? null,
      },
    });
  } catch (err) {
    console.error("Error: ", err);
    throw err;
  }
};

export const getAllReports = async () => {
  try {
    const response = await prisma.feedback.findMany({});
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Analytics queries
export const getRecentActivity = async () => {
  const [recentUsers, recentBlogs, recentSermons, recentEvents] =
    await Promise.all([
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      prisma.blog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, blogTitle: true, createdAt: true },
      }),
      prisma.sermon.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, sermonTitle: true, createdAt: true },
      }),
      prisma.events.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, event: true, createdAt: true },
      }),
    ]);

  const activities = [
    ...recentUsers.map((u) => ({
      id: `user-${u.id}`,
      type: "user" as const,
      title: `${u.name || u.email} registered`,
      timestamp: u.createdAt,
    })),
    ...recentBlogs.map((b) => ({
      id: `blog-${b.id}`,
      type: "blog" as const,
      title: `Blog published: ${b.blogTitle}`,
      timestamp: b.createdAt,
    })),
    ...recentSermons.map((s) => ({
      id: `sermon-${s.id}`,
      type: "sermon" as const,
      title: `Sermon added: ${s.sermonTitle}`,
      timestamp: s.createdAt,
    })),
    ...recentEvents.map((e) => ({
      id: `event-${e.id}`,
      type: "event" as const,
      title: `Event created: ${e.event}`,
      timestamp: e.createdAt,
    })),
  ];

  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);
};

export const getAnalyticsData = async () => {
  // User growth over last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const userGrowth = users.reduce((acc: Record<string, number>, user) => {
    const date = user.createdAt.toISOString().split("T")[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const userGrowthData = Object.entries(userGrowth).map(([date, count]) => ({
    date,
    users: count,
  }));

  // Content distribution
  const [blogsCount, sermonsCount, eventsCount] = await Promise.all([
    prisma.blog.count(),
    prisma.sermon.count(),
    prisma.events.count(),
  ]);

  const contentDistribution = [
    { name: "Blogs", value: blogsCount },
    { name: "Sermons", value: sermonsCount },
    { name: "Events", value: eventsCount },
  ];

  return { userGrowthData, contentDistribution };
};

export const getSystemStatus = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { database: "healthy", uptime: 99.9 };
  } catch (error) {
    return { database: "error", uptime: 0 };
  }
};

export const getNewUsersLast24Hours = async () => {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const count = await prisma.user.count({
    where: { createdAt: { gte: twentyFourHoursAgo } },
  });

  return count;
};

// Settings queries
export const getSiteSettings = async () => {
  let settings = await prisma.siteSettings.findFirst();

  // Create default settings if none exist
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {},
    });
  }

  return settings;
};

export const updateSiteSettings = async (data: any, userId?: string) => {
  const existing = await prisma.siteSettings.findFirst();

  if (existing) {
    return await prisma.siteSettings.update({
      where: { id: existing.id },
      data: { ...data, updatedBy: userId },
    });
  }

  return await prisma.siteSettings.create({
    data: { ...data, updatedBy: userId },
  });
};

// Notification queries
export const getNotifications = async () => {
  return await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const createNotification = async (data: {
  notification: string;
  shouldNotify: boolean;
  notificationDuration: string;
}) => {
  return await prisma.notification.create({
    data,
  });
};

export const updateNotification = async (
  id: string,
  data: {
    notification?: string;
    shouldNotify?: boolean;
    notificationDuration?: string;
  }
) => {
  return await prisma.notification.update({
    where: { id },
    data,
  });
};

export const deleteNotification = async (id: string) => {
  return await prisma.notification.delete({
    where: { id },
  });
};

const TRANSCRIPT_API_KEY = process.env.TRANSCRIPT_API_KEY;
const TRANSCRIPT_API_URL = process.env.TRANSCRIPT_API_URL;

export async function getSermonTranscript(
  videoUrl: string,
  options: GetTranscriptOptions
): Promise<TranscriptResponse | null> {
  const {
    format = "text",
    includeTimestamp = true,
    sendMetadata = false,
  } = options;

  const params = new URLSearchParams({
    video_url: videoUrl,
    format,
    include_timestamp: includeTimestamp.toString(),
    send_metadata: sendMetadata.toString(),
  });

  try {
    const response = await fetch(
      `${TRANSCRIPT_API_URL}/youtube/transcript?${params}`,
      {
        headers: {
          Authorization: `Bearer ${TRANSCRIPT_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw error;
  }
}
