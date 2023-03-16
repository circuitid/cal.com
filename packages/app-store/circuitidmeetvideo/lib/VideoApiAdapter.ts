import { v4 as uuidv4 } from "uuid";

import prisma from "@calcom/prisma";
import type { CalendarEvent } from "@calcom/types/Calendar";
import type { PartialReference } from "@calcom/types/EventManager";
import type { VideoApiAdapter, VideoCallData } from "@calcom/types/VideoApiAdapter";

const CircuitIDMeetApiAdapter = (): VideoApiAdapter => {
  return {
    getAvailability: () => {
      return Promise.resolve([]);
    },
    createMeeting: async (event: CalendarEvent): Promise<VideoCallData> => {
      console.error("scheduling event", event);

      if (!event || !event.destinationCalendar || !event.destinationCalendar.userId)
        return Promise.reject("Organizer ID not found");

      const user = await prisma.user.findUnique({
        where: { id: event.destinationCalendar.userId },
        select: {
          username: true,
        },
      });

      if (!user || !user.username) return Promise.reject("Organizer not found");

      const meetingID = uuidv4();
      return Promise.resolve({
        type: "circuitidmeet_video",
        id: meetingID,
        password: "",
        url: "https://meet.circuitid.com/" + user.username,
      });
    },
    deleteMeeting: async (): Promise<void> => {
      Promise.resolve();
    },
    updateMeeting: (bookingRef: PartialReference): Promise<VideoCallData> => {
      return Promise.resolve({
        type: "circuitidmeet_video",
        id: bookingRef.meetingId as string,
        password: bookingRef.meetingPassword as string,
        url: bookingRef.meetingUrl as string,
      });
    },
  };
};

export default CircuitIDMeetApiAdapter;
