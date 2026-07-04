const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.onNotificationAdded = functions.firestore
  .document('user_notifications/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.data();

    if (!newData || !newData.data || newData.data.length === 0) {
      return null;
    }

    // Get the latest notification from the array
    const notifications = newData.data;
    const latestNotification = notifications[0]; // Assuming prepended

    // If there's no new notification or it doesn't have a title, skip
    if (!latestNotification || !latestNotification.title) {
        return null;
    }

    // Fetch the user's FCM token from the users collection
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
        console.log(`User ${userId} not found.`);
        return null;
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
        console.log(`User ${userId} does not have an FCM token registered.`);
        return null;
    }

    const payload = {
      notification: {
        title: latestNotification.title,
        body: latestNotification.message || 'You have a new notification on ProcFin.',
        // icon: 'https://procfin.online/vite.svg'
      },
      data: {
        type: latestNotification.type || 'info',
        link: latestNotification.link || '/'
      }
    };

    try {
      const response = await admin.messaging().sendToDevice(fcmToken, payload);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.log('Error sending message:', error);
    }
  });
