import React from "react";

import Link from "next/link";

const EventsIntro = () => {
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
  return (
    <section className="h-full w-auto xl:pl-[50px] xl:pt-0 pt-5">
      <div className="sm:text-left sm:block flex flex-col items-center">
        <h3 className="tracking-widest mb-1 text-muted-foreground text-left">
          THIS {month.toUpperCase()}
        </h3>
        <div className="bg-muted-foreground opacity-50 h-[2px] w-1/2"></div>
      </div>
      <h1 className="font-bold sm:text-4xl text-3xl sm:text-left text-center pt-[30px] mb-[30px] sm:w-[300px]">
        Become a part of something great
      </h1>
      <p className="text-base sm:text-left text-center sm:w-72 leading-6 mb-[20px] sm:px-0 px-6">
        We enjoy being a multi-denominational church where we work together,
        worship together, and grow together.
      </p>
      <div>
        <Link href={"/events"}>
          <h3 className="font-bold text-sm tracking-wider sm:text-left text-center hover:opacity-55 cursor-pointer transition ease-in-out">
            + VIEW ALL EVENTS
          </h3>
        </Link>
      </div>
    </section>
  );
};

export default EventsIntro;
