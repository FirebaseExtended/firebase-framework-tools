import { v4 as uuidv4 } from 'uuid';

export function getDateString() {
  return new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "long",
    timeZone: "UTC",
  });
}

export function getRandomUUID() {
  return uuidv4();
}