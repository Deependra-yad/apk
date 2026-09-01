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

        val nm = getSystemService(NotificationManager::class.java)
        val builder = NotificationCompat.Builder(this, "liquid_chat_messages")
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)

        nm.notify(System.currentTimeMillis().toInt(), builder.build())
    }
}

