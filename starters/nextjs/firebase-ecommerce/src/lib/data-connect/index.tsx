import { connectorConfig } from '@firebasegen/default-connector'
import { firebaseApp } from "@/lib/firebase";
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect'

export const dc = getDataConnect(firebaseApp, connectorConfig)
if (process.env.FIREBASE_DATACONNECT_EMULATOR_HOST) {
  const [host, port,] = process.env.FIREBASE_DATACONNECT_EMULATOR_HOST.split(":");
  connectDataConnectEmulator(dc, host, +port);
}
