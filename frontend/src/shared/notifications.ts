export type Notification = { message: string; tone: 'success' | 'error' | 'info' };
export const notificationEvent = 'woodpecker:notification';
export function notify(message: string, tone: Notification['tone'] = 'success') {
  window.dispatchEvent(new CustomEvent<Notification>(notificationEvent, { detail: { message, tone } }));
}
