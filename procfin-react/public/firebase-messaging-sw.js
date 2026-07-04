importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBfdTHmctnug0gxFhCfQfRqEPWBLCN5Ujs",
    authDomain: "lambolimos.firebaseapp.com",
    databaseURL: "https://lambolimos-default-rtdb.firebaseio.com",
    projectId: "lambolimos",
    storageBucket: "lambolimos.appspot.com",
    messagingSenderId: "120025515314",
    appId: "1:120025515314:web:ac8587251ddbe1931b832b",
    measurementId: "G-PV5WLNZBPG"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/vite.svg', // Assuming there's a vite.svg or you can replace with a logo
        data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
