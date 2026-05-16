-- Enable Realtime on notifications table so WinNotificationLayer receives live INSERTs
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
