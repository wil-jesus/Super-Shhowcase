"use client";

import { useEffect, useRef, useState } from "react";
import { markNotificationRead, useNotifications } from "@/lib/hooks/use-notifications";
import { Badge } from "@/components/ui/Badge";

export function NotificationBell() {
  const { notifications, unreadCount, isLoading, mutate } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleRead = async (id: string, read: boolean) => {
    if (read) return;

    await markNotificationRead(id);
    await mutate();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-brand-600"
        aria-label="Notificações"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <Badge
            color="gray"
            className="absolute right-0.5 top-0.5 h-4 min-w-4 justify-center bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
          role="menu"
          aria-label="Lista de notificações"
        >
          {isLoading ? (
            <div className="p-6 text-center text-sm text-gray-400">Carregando...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">Sem notificações</div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <button
                type="button"
                key={notification.id}
                onClick={() => handleRead(notification.id, notification.read)}
                className={`w-full border-b border-gray-50 p-3 text-left hover:bg-gray-50 ${
                  !notification.read ? "bg-brand-50" : ""
                }`}
                role="menuitem"
              >
                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{notification.body}</p>
                <p className="mt-1 text-[10px] text-gray-400">
                  {new Date(notification.createdAt).toLocaleString("pt-BR")}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}