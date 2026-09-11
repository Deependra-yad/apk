package com.liquidchat.app

import android.app.NotificationManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class FCMService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("FCMService", "Refreshed token: $token")
        // We will pass this to the frontend via MainActivity
        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
        prefs.edit().putString("fcm_token", token).apply()
        
        // Broadcast it
        val intent = android.content.Intent("FCM_TOKEN_REFRESH")
        intent.putExtra("token", token)
        sendBroadcast(intent)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val title = remoteMessage.notification?.title ?: remoteMessage.data["title"] ?: "Liquid Chat"
        val body = remoteMessage.notification?.body ?: remoteMessage.data["body"] ?: "New message"
        val type = remoteMessage.data["type"] ?: "message"
        val callerId = remoteMessage.data["callerId"] ?: ""
        val isVideo = remoteMessage.data["isVideo"] == "true"

        val nm = getSystemService(NotificationManager::class.java)

        if (type == "call") {
            // Intent to accept call
            val acceptIntent = android.content.Intent(this, MainActivity::class.java).apply {
                action = "ACCEPT_CALL"
                putExtra("callerId", callerId)
                putExtra("isVideo", isVideo)
                flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val acceptPendingIntent = android.app.PendingIntent.getActivity(
                this, 101, acceptIntent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )

            // Intent to decline call
            val declineIntent = android.content.Intent(this, MainActivity::class.java).apply {
                action = "DECLINE_CALL"
                putExtra("callerId", callerId)
                flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val declinePendingIntent = android.app.PendingIntent.getActivity(
                this, 102, declineIntent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )

            val callBuilder = NotificationCompat.Builder(this, "liquid_chat_calls")
                .setSmallIcon(android.R.drawable.sym_action_call)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setAutoCancel(true)
                .setOngoing(true)
                .setVibrate(longArrayOf(0, 500, 250, 500, 250, 500))
                .setContentIntent(acceptPendingIntent)
                .setFullScreenIntent(acceptPendingIntent, true)
                .addAction(android.R.drawable.sym_action_call, "Pick Up", acceptPendingIntent)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Hang Up", declinePendingIntent)

            nm.notify(9999, callBuilder.build())
        } else {
            val contentIntent = android.content.Intent(this, MainActivity::class.java).apply {
                flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val contentPendingIntent = android.app.PendingIntent.getActivity(
                this, 0, contentIntent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )

            val builder = NotificationCompat.Builder(this, "liquid_chat_messages")
                .setSmallIcon(android.R.drawable.stat_notify_chat)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(contentPendingIntent)

            nm.notify(System.currentTimeMillis().toInt(), builder.build())
        }
    }
}

