export const isNotificationSupported = () => {
  return typeof window !== "undefined" && "Notification" in window;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  return permission;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
};

export const sendNotification = (title: string, body: string) => {
  if (!isNotificationSupported()) return;
  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    } catch (e) {
      console.warn("Direct Notification constructor failed, trying service worker fallback:", e);
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: "/favicon.ico",
          });
        });
      }
    }
  }
};
