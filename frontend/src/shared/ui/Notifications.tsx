import { useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import { notificationEvent, type Notification } from '../notifications/notifications';
export function Notifications() {
  const [items, setItems] = useState<(Notification & { id: number })[]>([]);
  useEffect(() => {
    let id = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const receive = (event: Event) => {
      const item = { ...(event as CustomEvent<Notification>).detail, id: ++id };
      setItems((current) => [...current.slice(-2), item]);
      const timer = setTimeout(() => {
        setItems((current) => current.filter((entry) => entry.id !== item.id));
        timers.delete(timer);
      }, 6000);
      timers.add(timer);
    };
    window.addEventListener(notificationEvent, receive);
    return () => {
      window.removeEventListener(notificationEvent, receive);
      timers.forEach(clearTimeout);
    };
  }, []);
  return (
    <div className="ui-notifications" aria-live="polite" aria-atomic="false">
      {items.map((item) => {
        const Icon = item.tone === 'success' ? CheckCircle2 : item.tone === 'error' ? CircleAlert : Info;
        return (
          <div className={`ui-notification ui-notification--${item.tone}`} role="status" key={item.id}>
            <Icon size={20} aria-hidden="true" />
            <span>{item.message}</span>
            <button
              type="button"
              aria-label="Fermer la notification"
              onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
