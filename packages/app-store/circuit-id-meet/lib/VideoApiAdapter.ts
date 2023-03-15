import { v4 as uuidv4 } from "uuid";

import type { CalendarEvent } from "@calcom/types/Calendar";
import type { PartialReference } from "@calcom/types/EventManager";
import type { VideoApiAdapter, VideoCallData } from "@calcom/types/VideoApiAdapter";

const CircuitIDMeetApiAdapter = (): VideoApiAdapter => {
  return {
    getAvailability: () => {
      return Promise.resolve([]);
    },
    createMeeting: async (event: CalendarEvent): Promise<VideoCallData> => {
      console.log("scheduling event", event);
      const meetingID = uuidv4();
      return Promise.resolve({
        type: "circuit-id-meet_video",
        id: meetingID,
        password: "",
        url: "https://meet.circuitid.com/" + event.uid,
      });
    },
    deleteMeeting: async (): Promise<void> => {
      Promise.resolve();
    },
    updateMeeting: (bookingRef: PartialReference): Promise<VideoCallData> => {
      return Promise.resolve({
        type: "circuit-id-meet_video",
        id: bookingRef.meetingId as string,
        password: bookingRef.meetingPassword as string,
        url: bookingRef.meetingUrl as string,
      });
    },
  };
};

export default CircuitIDMeetApiAdapter;
