// Notification Service for Real-time Updates
import { io } from 'socket.io-client';

class NotificationService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.notificationQueue = [];
  }

  // Initialize socket connection
  connect() {
    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to notification server');
      const token = localStorage.getItem('token');
      if (token) {
        this.socket.emit('authenticate', token);
      }
    });

    this.socket.on('notification', (notification) => {
      this.handleNotification(notification);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from notification server');
    });
  }

  // Request browser notification permission
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Send browser push notification
  sendPushNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  }

  // Handle incoming notifications
  handleNotification(notification) {
    console.log('📬 New notification:', notification);
    
    // Store in queue
    this.notificationQueue.push({
      ...notification,
      timestamp: Date.now(),
      read: false,
    });

    // Send push notification
    this.sendPushNotification(notification.title, {
      body: notification.message,
      tag: notification.type,
    });

    // Notify all listeners
    this.listeners.forEach((callback) => callback(notification));

    // Store in localStorage
    this.saveNotifications();
  }

  // Subscribe to notifications
  subscribe(callback) {
    const id = Date.now();
    this.listeners.set(id, callback);
    return () => this.listeners.delete(id);
  }

  // Get all notifications
  getNotifications() {
    return this.notificationQueue;
  }

  // Get unread count
  getUnreadCount() {
    return this.notificationQueue.filter((n) => !n.read).length;
  }

  // Mark as read
  markAsRead(index) {
    if (this.notificationQueue[index]) {
      this.notificationQueue[index].read = true;
      this.saveNotifications();
    }
  }

  // Mark all as read
  markAllAsRead() {
    this.notificationQueue.forEach((n) => (n.read = true));
    this.saveNotifications();
  }

  // Clear all notifications
  clearAll() {
    this.notificationQueue = [];
    this.saveNotifications();
  }

  // Save to localStorage
  saveNotifications() {
    try {
      localStorage.setItem(
        'notifications',
        JSON.stringify(this.notificationQueue)
      );
    } catch (err) {
      console.error('Failed to save notifications:', err);
    }
  }

  // Load from localStorage
  loadNotifications() {
    try {
      const saved = localStorage.getItem('notifications');
      if (saved) {
        this.notificationQueue = JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
