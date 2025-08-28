import type { Timestamp } from "firebase/firestore";

export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  message: string;
  timestamp: Timestamp;
}
