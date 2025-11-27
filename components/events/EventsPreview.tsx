"use client";

import { getAllEvents } from "@/lib/queries";
import { EventType } from "@/lib/types";
import {
  getLastSundayOfTheMonthFull,
  getLastSundayOfTheMonth,
} from "@/lib/actions";

import React from "react";

import EventsIntro from "./EventsIntro";
import EventCards from "./EventCards";

const EventsPreview = () => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [events, setEvents] = React.useState<EventType>([]);

  const today = new Date(Date.now());
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = months[today.getMonth()];

  const lastSunday = getLastSundayOfTheMonth(
    today.getFullYear(),
    today.getMonth()
  );
  const lastSundayFull = getLastSundayOfTheMonthFull(
    today.getFullYear(),
    today.getMonth()
  );

  React.useEffect(() => {
    setIsLoading(true);
    const fetchEvents = async () => {
      const response = await getAllEvents();

      const upcomingEvents = response
        .filter((e) => {
          if (e.date.length > 0) {
            const eventDate = new Date(e.date[0]);
            return eventDate >= today;
          }
          return false;
        })
        .sort(
          (a, b) =>
            new Date(a.date[0]).getTime() - new Date(b.date[0]).getTime()
        );

      let monthlyEvents = response.filter((e) => e.monthly);
      upcomingEvents.push(...monthlyEvents);
      setEvents(Object(upcomingEvents));
      setIsLoading(false);
    };
    fetchEvents();
  }, []); // Empty dependency array ensures this runs only once

  return (
    <section className="h-auto flex items-center overflow-hidden w-screen">
      <div className="bg-secondary w-full h-full flex xl:flex-nowrap flex-wrap items-center justify-center px-5">
        <EventsIntro />
        <EventCards isLoading={isLoading} events={events} lastSundayFull={lastSundayFull} lastSunday={lastSunday} />
        <div className="hidden absolute bottom-20 right-[450px] 3xl:flex gap-1.5">
          <div className="bg-black w-[15px] h-[15px] rounded-[50%] cursor-pointer"></div>
          <div className="bg-gray-500 w-[15px] h-[15px] rounded-[50%] cursor-pointer"></div>
        </div>
      </div>
    </section>
  );
};

export default EventsPreview;
