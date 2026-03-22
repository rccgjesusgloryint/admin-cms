import { EventType } from "@/lib/types";
import React from "react";

import { MdEventRepeat } from "react-icons/md";
import { FaRegMap } from "react-icons/fa";
import { LuClock3 } from "react-icons/lu";

import { useRouter } from "next/navigation";

type CardProps = {
  events: EventType;
  lastSundayFull: string;
  lastSunday: string[];
};

const Cards = ({ events, lastSundayFull, lastSunday }: CardProps) => {
  const router = useRouter();

  const handleNavigation = (id: number) => {
    router.push(`/events/${id}`);
  };

  return events.length > 0 ? (
    events?.slice(0, 3).map((event: any, index: any) => {
      return (
        <div
          className={`w-[300px] min-h-[420px] h-auto bg-card px-[30px] pt-[74px] pb-[40px] text-left relative shadow-xl xl:mb-0 mb-10 lg:block ${
            index === 2 ? "hidden" : ""
          }`}
          key={index}
        >
          {event.date[0] && !event.monthly ? (
            <div className="absolute bg-primary flex flex-wrap justify-center items-center content-center top-[-45px] rounded-[50%] w-[90px] h-[90px] pt-[8px] text-primary-foreground drop-shadow-custom">
              <p className="text-[28px] text-center w-full mb-[3px] leading-6">
                {event.date[0]?.split(" ")[1]?.length > 2
                  ? event.date[0]?.split(" ")[1]?.slice(0, 2)
                  : event.date[0]?.split(" ")[1]?.slice(0, 1)}
              </p>
              <p className="text-base mb-[10px]">
                {event.date[0]?.length > 3
                  ? event.date[0]?.slice(0, 3)
                  : event.date[0]}
              </p>
            </div>
          ) : event.monthly ? (
            <div className="absolute bg-primary flex flex-wrap justify-center items-center content-center top-[-45px] rounded-[50%] w-[90px] h-[90px] pt-[8px] text-primary-foreground drop-shadow-custom">
              <MdEventRepeat className="text-[28px]" />
            </div>
          ) : (
            <div className="absolute bg-primary flex flex-wrap justify-center items-center content-center top-[-45px] rounded-[50%] w-[90px] h-[90px] pt-[8px] text-primary-foreground drop-shadow-custom">
              <>
                <p className="text-[28px] text-center w-full mb-[3px] leading-6">
                  {lastSunday[1]}
                </p>
                <p className="text-base mb-[10px]">{lastSunday[0]}</p>
              </>
            </div>
          )}

          <h2 className="font-bold text-2xl w-[230px] mb-[20px]">
            {event?.event}
          </h2>
          <div className="relative">
            <div className="flex flex-col absolute w-[112px]">
              <span className="mt-1">
                <LuClock3 />
              </span>
              <span className=""></span>
            </div>
            <div className="font-bold text-base pl-10">
              {event.monthly ? (
                <p>Monthly</p>
              ) : event.date[0] ? (
                <span>
                  <div>
                    <p>{event.date[0]}</p>
                  </div>
                  <div>
                    <p>{event.date[1]}</p>
                  </div>
                </span>
              ) : (
                <p>{lastSundayFull}</p>
              )}
            </div>
            <div className="pt-[20px]">
              <span className="absolute mt-[5px]">
                <FaRegMap />
              </span>
              <p className="font-bold text-base pl-10">
                {event.location.length > 25
                  ? // events[1].location?.split(" ")?.slice(0, 3)
                    event.location?.slice(0, 25) + "..."
                  : event.location}
              </p>
            </div>
          </div>
          <div
            className="border-2 border-light-gr mt-[56px] w-[160px] h-[60px] flex justify-center items-center hover:bg-light-gr hover:text-white cursor-pointer transition ease-in-out"
            onClick={() => handleNavigation(event.id)}
          >
            <button className="font-bold text-sm tracking-wider">
              READ MORE
            </button>
          </div>
        </div>
      );
    })
  ) : (
    <div className="sm:mb-0 mb-10">
      <h1>No events yet!</h1>
    </div>
  );
};

export default Cards;
