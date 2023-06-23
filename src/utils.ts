export async function isUsingFirebaseJsSdk() {
  if(!process.env.__FIREBASE_DEFAULTS__) return false;

  try {
    await import('firebase/app');

    return true
  } catch (e) {
    return false;
  }
}