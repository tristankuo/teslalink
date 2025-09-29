const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.cleanupQrSessions = functions.pubsub.schedule("every 60 minutes").onRun(async (context) => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const sessionsRef = admin.database().ref("qr_sessions");

  try {
    const snapshot = await sessionsRef.orderByChild("createdAt").endAt(oneHourAgo).once("value");
    const updates = {};
    snapshot.forEach((child) => {
      updates[child.key] = null;
    });

    await sessionsRef.update(updates);
    console.log(`Cleaned up ${Object.keys(updates).length} old QR sessions.`);
    return null;
  } catch (error) {
    console.error("Error cleaning up QR sessions:", error);
    return null;
  }
});
