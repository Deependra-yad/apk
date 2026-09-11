package com.liquidchat.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.DownloadManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Message
import android.provider.MediaStore
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.*
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Vibrator
import android.os.VibrationEffect
import androidx.core.app.NotificationCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    private var activeRingtone: Ringtone? = null
    private var callVibrator: Vibrator? = null

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var cameraImageUri: Uri? = null

    private var customViewCallback: WebChromeClient.CustomViewCallback? = null
    private var customView: View? = null

    private val WEB_URL = "https://liquidchat.online/web"
 
    // Permission request launcher
    private lateinit var permissionLauncher: ActivityResultLauncher<Array<String>>

    // File chooser launcher
    private lateinit var fileChooserLauncher: ActivityResultLauncher<Intent>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Fix overlapping items by fitting system windows, but hide nav bar for full screen
        WindowCompat.setDecorFitsSystemWindows(window, true)
        window.statusBarColor = Color.parseColor("#0a0a0f")
        window.navigationBarColor = Color.parseColor("#0a0a0f")
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
            // Hide the system navigation bar (bottom pill/buttons) for full screen
            hide(androidx.core.view.WindowInsetsCompat.Type.navigationBars())
            systemBarsBehavior = androidx.core.view.WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Create notification channel
        createNotificationChannel()

        // Setup permission launcher
        permissionLauncher = registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { permissions ->
            // Permissions handled, WebView will re-request via onPermissionRequest
        }

        // Setup file chooser launcher
        fileChooserLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                val data = result.data
                val results: Array<Uri>? = when {
                    data?.clipData != null -> {
                        val count = data.clipData!!.itemCount
                        Array(count) { i -> data.clipData!!.getItemAt(i).uri }
                    }
                    data?.data != null -> arrayOf(data.data!!)
                    cameraImageUri != null -> arrayOf(cameraImageUri!!)
                    else -> null
                }
                fileUploadCallback?.onReceiveValue(results ?: arrayOf())
            } else {
                fileUploadCallback?.onReceiveValue(arrayOf())
            }
            fileUploadCallback = null
        }

        // Request essential permissions upfront
        requestEssentialPermissions()

        // Create layout
        val rootLayout = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#0a0a0f"))
        }

        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        rootLayout.addView(webView)
        setContentView(rootLayout)

        setupWebView()

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(WEB_URL)
            handleDeepLink(intent)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            allowContentAccess = true
            loadWithOverviewMode = true
            useWideViewPort = true
            setSupportMultipleWindows(false)
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            javaScriptCanOpenWindowsAutomatically = true

            // Enable modern web features
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                safeBrowsingEnabled = true
            }
        }

        // Anti-modder & reverse engineering protection: disable remote WebView inspection
        WebView.setWebContentsDebuggingEnabled(false)

        // Force dark mode in WebView to match the app's dark theme
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(webView.settings, false)
        }

        // Add Javascript Interface for Notifications
        webView.addJavascriptInterface(object : Any() {
            @JavascriptInterface
            fun showNotification(title: String, body: String) {
                runOnUiThread {
                    val nm = getSystemService(NotificationManager::class.java)
                    val builder = androidx.core.app.NotificationCompat.Builder(this@MainActivity, "liquid_chat_messages")
                        .setSmallIcon(android.R.drawable.stat_notify_chat)
                        .setContentTitle(title)
                        .setContentText(body)
                        .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
                        .setAutoCancel(true)
                    
                    nm.notify(System.currentTimeMillis().toInt(), builder.build())
                }
            }

            @JavascriptInterface
            fun getFCMToken(): String {
                val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
                return prefs.getString("fcm_token", "") ?: ""
            }

            @JavascriptInterface
            fun downloadFile(url: String, filename: String) {
                runOnUiThread {
                    downloadUrlDirectly(url, filename)
                }
            }

            @JavascriptInterface
            fun saveBase64File(base64Data: String, filename: String) {
                runOnUiThread {
                    try {
                        val cleanBase64 = if (base64Data.contains(",")) base64Data.substringAfter(",") else base64Data
                        val bytes = android.util.Base64.decode(cleanBase64, android.util.Base64.DEFAULT)
                        val cleanFilename = filename.substringBefore("?").substringBefore("#")
                            .replace(Regex("[\\\\/:*?\"<>|]"), "_")
                            .trim()
                            .ifBlank { "file_${System.currentTimeMillis()}" }

                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            val values = android.content.ContentValues().apply {
                                put(MediaStore.MediaColumns.DISPLAY_NAME, cleanFilename)
                                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                            }
                            val uri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                            if (uri != null) {
                                contentResolver.openOutputStream(uri)?.use { it.write(bytes) }
                                Toast.makeText(this@MainActivity, "Saved to Downloads: $cleanFilename", Toast.LENGTH_SHORT).show()
                                return@runOnUiThread
                            }
                        }

                        val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                        if (!downloadsDir.exists()) downloadsDir.mkdirs()
                        val file = java.io.File(downloadsDir, cleanFilename)
                        java.io.FileOutputStream(file).use { it.write(bytes) }
                        android.media.MediaScannerConnection.scanFile(this@MainActivity, arrayOf(file.absolutePath), null, null)
                        Toast.makeText(this@MainActivity, "Saved to Downloads: $cleanFilename", Toast.LENGTH_SHORT).show()
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "Save failed: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }

            @JavascriptInterface
            fun openExternalBrowser(url: String) {
                runOnUiThread {
                    try {
                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        startActivity(browserIntent)
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "Cannot open browser", Toast.LENGTH_SHORT).show()
                    }
                }
            }

            @JavascriptInterface
            fun startIncomingCallRingtone(callerName: String, isVideo: Boolean) {
                runOnUiThread {
                    startIncomingCallRingtoneInternal(callerName, isVideo)
                }
            }

            @JavascriptInterface
            fun stopCallRingtone() {
                runOnUiThread {
                    stopCallRingtoneInternal()
                }
            }
        }, "Android")

        webView.setDownloadListener { url, userAgent, contentDisposition, mimetype, _ ->
            val guessName = URLUtil.guessFileName(url, contentDisposition, mimetype)
            downloadUrlDirectly(url, guessName)
        }

        // Fetch token directly on boot as well
        com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result
                getSharedPreferences("app_prefs", MODE_PRIVATE).edit().putString("fcm_token", token).apply()
                // Inject token directly into the web app
                runOnUiThread {
                    webView.evaluateJavascript("window.postMessage({type: 'FCM_TOKEN', token: '$token'}, '*');", null)
                }
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Inject CSS to fix viewport and hide browser-specific elements
                view?.evaluateJavascript("""
                    (function() {
                        var meta = document.querySelector('meta[name=viewport]');
                        if (!meta) {
                            meta = document.createElement('meta');
                            meta.name = 'viewport';
                            document.head.appendChild(meta);
                        }
                        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
                    })();
                """.trimIndent(), null)
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false

                // Intercept Google OAuth and open in system browser (Chrome) to prevent disallowed_useragent 403
                if (url.contains("accounts.google.com") || url.contains("google.com/o/oauth2")) {
                    try {
                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        startActivity(browserIntent)
                        return true
                    } catch (e: Exception) {
                        // Ignore
                    }
                }

                // Intercept any file downloads natively
                if (url.endsWith(".apk") || url.contains("/uploads/") || url.contains("/api/media/export/") || url.contains("download=1") || (url.contains("/api/upload/") && !url.contains("/api/upload/avatar"))) {
                    val guessName = URLUtil.guessFileName(url, null, null)
                    downloadUrlDirectly(url, guessName)
                    return true
                }

                // Keep navigation within the app for our domains
                if (url.contains("apk-flame.vercel.app") ||
                    url.contains("liquidchat.online") ||
                    url.contains("apk-production-740c.up.railway.app")) {
                    return false
                }

                // Open external links in the system browser
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                } catch (e: ActivityNotFoundException) {
                    // Ignore
                }
                return true
            }

            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: android.net.http.SslError?) {
                // Anti-modder & MITM Protection: strictly reject invalid/proxy certificates
                handler?.cancel()
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                // Only handle main frame errors
                if (request?.isForMainFrame == true) {
                    view?.loadData(
                        """
                        <html>
                        <head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
                        <body style="background:#0a0a0f;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px">
                            <div>
                                <h2 style="color:#00d2ff">Connection Error</h2>
                                <p style="color:#888">Unable to reach Liquid Chat servers.<br>Please check your internet connection.</p>
                                <button onclick="location.href='$WEB_URL'" style="margin-top:20px;padding:12px 30px;background:#00d2ff;color:#000;border:none;border-radius:12px;font-size:16px;font-weight:bold;cursor:pointer">Retry</button>
                            </div>
                        </body>
                        </html>
                        """.trimIndent(),
                        "text/html", "UTF-8"
                    )
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            // Handle camera and microphone permissions for WebRTC calls
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.let {
                    val requestedResources = it.resources
                    val grantedResources = mutableListOf<String>()

                    for (resource in requestedResources) {
                        when (resource) {
                            PermissionRequest.RESOURCE_VIDEO_CAPTURE -> {
                                if (hasCameraPermission()) {
                                    grantedResources.add(resource)
                                } else {
                                    requestCameraPermission()
                                    grantedResources.add(resource) // Grant anyway, system will prompt
                                }
                            }
                            PermissionRequest.RESOURCE_AUDIO_CAPTURE -> {
                                if (hasMicPermission()) {
                                    grantedResources.add(resource)
                                } else {
                                    requestMicPermission()
                                    grantedResources.add(resource)
                                }
                            }
                            else -> grantedResources.add(resource)
                        }
                    }

                    if (grantedResources.isNotEmpty()) {
                        runOnUiThread {
                            it.grant(grantedResources.toTypedArray())
                        }
                    } else {
                        runOnUiThread { it.deny() }
                    }
                }
            }

            // Handle file uploads (images, documents, etc.)
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                val acceptTypes = fileChooserParams?.acceptTypes ?: arrayOf("*/*")
                val captureEnabled = fileChooserParams?.isCaptureEnabled == true

                val chooserIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = if (acceptTypes.isNotEmpty() && acceptTypes[0].isNotEmpty()) acceptTypes[0] else "*/*"
                    if (acceptTypes.size > 1) {
                        putExtra(Intent.EXTRA_MIME_TYPES, acceptTypes)
                    }
                    putExtra(Intent.EXTRA_ALLOW_MULTIPLE, fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE)
                }

                val intents = mutableListOf<Intent>()

                // Add camera capture option if it's an image upload
                if (acceptTypes.any { it.startsWith("image") || it == "*/*" }) {
                    val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                    if (takePictureIntent.resolveActivity(packageManager) != null) {
                        intents.add(takePictureIntent)
                    }
                }

                // Add video capture option
                if (acceptTypes.any { it.startsWith("video") || it == "*/*" }) {
                    val takeVideoIntent = Intent(MediaStore.ACTION_VIDEO_CAPTURE)
                    if (takeVideoIntent.resolveActivity(packageManager) != null) {
                        intents.add(takeVideoIntent)
                    }
                }

                val finalIntent = if (intents.isNotEmpty()) {
                    Intent.createChooser(chooserIntent, "Choose file").apply {
                        putExtra(Intent.EXTRA_INITIAL_INTENTS, intents.toTypedArray())
                    }
                } else {
                    chooserIntent
                }

                try {
                    fileChooserLauncher.launch(finalIntent)
                } catch (e: ActivityNotFoundException) {
                    fileUploadCallback = null
                    Toast.makeText(this@MainActivity, "Cannot open file chooser", Toast.LENGTH_SHORT).show()
                    return false
                }

                return true
            }

            // Handle full-screen video (e.g., watching a video in chat)
            override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                if (customView != null) {
                    callback?.onCustomViewHidden()
                    return
                }
                customView = view
                customViewCallback = callback
                val decorView = window.decorView as FrameLayout
                decorView.addView(view, FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                ))
                webView.visibility = View.GONE
            }

            override fun onHideCustomView() {
                if (customView == null) return
                val decorView = window.decorView as FrameLayout
                decorView.removeView(customView)
                customView = null
                webView.visibility = View.VISIBLE
                customViewCallback?.onCustomViewHidden()
                customViewCallback = null
            }

            // Handle JavaScript alerts/confirms/prompts
            override fun onJsAlert(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                androidx.appcompat.app.AlertDialog.Builder(this@MainActivity)
                    .setTitle("Liquid Chat")
                    .setMessage(message)
                    .setPositiveButton("OK") { _, _ -> result?.confirm() }
                    .setCancelable(false)
                    .show()
                return true
            }

            override fun onJsConfirm(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                androidx.appcompat.app.AlertDialog.Builder(this@MainActivity)
                    .setTitle("Liquid Chat")
                    .setMessage(message)
                    .setPositiveButton("OK") { _, _ -> result?.confirm() }
                    .setNegativeButton("Cancel") { _, _ -> result?.cancel() }
                    .setCancelable(false)
                    .show()
                return true
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "liquid_chat_messages",
                "Messages",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Liquid Chat message notifications"
                enableLights(true)
                lightColor = Color.parseColor("#00d2ff")
                enableVibration(true)
            }

            val ringtoneUri: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .build()

            val callChannel = NotificationChannel(
                "liquid_chat_calls",
                "Calls",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Liquid Chat call notifications"
                enableLights(true)
                lightColor = Color.parseColor("#ff7597")
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 1000, 1000, 1000, 1000)
                setSound(ringtoneUri, audioAttributes)
            }

            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
            nm.createNotificationChannel(callChannel)
        }
    }

    private fun requestEssentialPermissions() {
        val perms = mutableListOf<String>()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED) {
            perms.add(Manifest.permission.CAMERA)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            perms.add(Manifest.permission.RECORD_AUDIO)
        }
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
                perms.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                perms.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        if (perms.isNotEmpty()) {
            permissionLauncher.launch(perms.toTypedArray())
        }
    }

    private fun hasCameraPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED

    private fun hasMicPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    private fun requestCameraPermission() {
        permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA))
    }

    private fun requestMicPermission() {
        permissionLauncher.launch(arrayOf(Manifest.permission.RECORD_AUDIO))
    }

    private fun downloadUrlDirectly(url: String, filename: String) {
        try {
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                Toast.makeText(this, "Invalid download link", Toast.LENGTH_SHORT).show()
                return
            }

            val cleanFilename = filename.substringBefore("?").substringBefore("#")
                .replace(Regex("[\\\\/:*?\"<>|]"), "_")
                .trim()
                .ifBlank { "download_${System.currentTimeMillis()}" }

            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setTitle(cleanFilename)
                setDescription("Downloading $cleanFilename")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, cleanFilename)
                setAllowedOverMetered(true)
                setAllowedOverRoaming(true)
                
                // Add Cookies and User-Agent headers
                val cookies = CookieManager.getInstance().getCookie(url)
                if (!cookies.isNullOrEmpty()) {
                    addRequestHeader("Cookie", cookies)
                }
                addRequestHeader("User-Agent", webView.settings.userAgentString)
                
                val extension = MimeTypeMap.getFileExtensionFromUrl(url.substringBefore("?"))
                val ext = if (!extension.isNullOrEmpty()) extension else cleanFilename.substringAfterLast('.', "")
                if (!ext.isNullOrEmpty()) {
                    val mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext.lowercase())
                    if (!mime.isNullOrEmpty()) {
                        setMimeType(mime)
                    }
                }
            }
            val dm = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
            dm.enqueue(request)
            Toast.makeText(this, "Downloading $cleanFilename to Downloads folder...", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            // Secondary attempt using app-specific external files dir (scoped storage fallback)
            try {
                val cleanFilename = filename.substringBefore("?").substringBefore("#")
                    .replace(Regex("[\\\\/:*?\"<>|]"), "_")
                    .trim()
                    .ifBlank { "download_${System.currentTimeMillis()}" }
                val request = DownloadManager.Request(Uri.parse(url)).apply {
                    setTitle(cleanFilename)
                    setDescription("Downloading $cleanFilename")
                    setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    setDestinationInExternalFilesDir(this@MainActivity, Environment.DIRECTORY_DOWNLOADS, cleanFilename)
                    setAllowedOverMetered(true)
                    setAllowedOverRoaming(true)
                }
                val dm = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
                dm.enqueue(request)
                Toast.makeText(this, "Downloading $cleanFilename...", Toast.LENGTH_SHORT).show()
            } catch (e2: Exception) {
                // Final Fallback: Open in system browser
                try {
                    val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    browserIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    startActivity(browserIntent)
                    Toast.makeText(this, "Opening in browser to download...", Toast.LENGTH_SHORT).show()
                } catch (ex: Exception) {
                    Toast.makeText(this, "Download failed: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    // Handle back button - navigate back in WebView history
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            // If in full-screen video, exit it
            if (customView != null) {
                webView.webChromeClient?.onHideCustomView()
                return true
            }
            // If WebView can go back, go back
            if (webView.canGoBack()) {
                webView.goBack()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleDeepLink(intent)
        handleCallAction(intent)
    }

    private fun handleCallAction(intent: Intent?) {
        when (intent?.action) {
            "ACCEPT_CALL" -> {
                stopCallRingtoneInternal()
                val js = """
                    (function() {
                        var btn = document.querySelector('[data-testid="accept-call-btn"]') || 
                                  document.querySelector('button[title*="Answer"]') ||
                                  document.querySelector('button[title*="Pick"]');
                        if (btn) btn.click();
                    })();
                """.trimIndent()
                webView.postDelayed({ webView.evaluateJavascript(js, null) }, 300)
            }
            "DECLINE_CALL" -> {
                stopCallRingtoneInternal()
                val js = """
                    (function() {
                        var btn = document.querySelector('[data-testid="decline-call-btn"]') || 
                                  document.querySelector('button[title*="Decline"]') ||
                                  document.querySelector('button[title*="Hang"]');
                        if (btn) btn.click();
                    })();
                """.trimIndent()
                webView.postDelayed({ webView.evaluateJavascript(js, null) }, 300)
            }
        }
    }

    private fun startIncomingCallRingtoneInternal(callerName: String, isVideo: Boolean) {
        try {
            stopCallRingtoneInternal()

            // Play Android system default incoming call ringtone
            val ringtoneUri: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            activeRingtone = RingtoneManager.getRingtone(applicationContext, ringtoneUri)?.apply {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    isLooping = true
                }
                play()
            }

            // Vibrate pattern
            callVibrator = getSystemService(android.content.Context.VIBRATOR_SERVICE) as? Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                callVibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 1000, 1000, 1000, 1000), 0))
            } else {
                @Suppress("DEPRECATION")
                callVibrator?.vibrate(longArrayOf(0, 1000, 1000, 1000, 1000), 0)
            }

            showCallHeadsUpNotification(callerName, isVideo)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun stopCallRingtoneInternal() {
        try {
            activeRingtone?.stop()
            activeRingtone = null
            callVibrator?.cancel()
            callVibrator = null
            val nm = getSystemService(NotificationManager::class.java)
            nm.cancel(9999)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun showCallHeadsUpNotification(callerName: String, isVideo: Boolean) {
        try {
            val acceptIntent = Intent(this, MainActivity::class.java).apply {
                action = "ACCEPT_CALL"
                putExtra("isVideo", isVideo)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val acceptPending = android.app.PendingIntent.getActivity(
                this, 101, acceptIntent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )

            val declineIntent = Intent(this, MainActivity::class.java).apply {
                action = "DECLINE_CALL"
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val declinePending = android.app.PendingIntent.getActivity(
                this, 102, declineIntent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )

            val builder = NotificationCompat.Builder(this, "liquid_chat_calls")
                .setSmallIcon(android.R.drawable.sym_action_call)
                .setContentTitle("Incoming " + (if (isVideo) "Video Call" else "Voice Call"))
                .setContentText("$callerName is calling...")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setOngoing(true)
                .setAutoCancel(true)
                .setContentIntent(acceptPending)
                .setFullScreenIntent(acceptPending, true)
                .addAction(android.R.drawable.sym_action_call, "Pick Up", acceptPending)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Hang Up", declinePending)

            val nm = getSystemService(NotificationManager::class.java)
            nm.notify(9999, builder.build())
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun handleDeepLink(intent: Intent?) {
        val data = intent?.data ?: return
        val scheme = data.scheme
        val host = data.host

        if (scheme == "liquidchat" && host == "auth") {
            val token = data.getQueryParameter("token")
            val user = data.getQueryParameter("user")
            if (!token.isNullOrEmpty()) {
                val cleanUser = user ?: ""
                val js = """
                    (function() {
                        try {
                            localStorage.setItem('liquid_token', '$token');
                            ${if (cleanUser.isNotEmpty()) "localStorage.setItem('liquid_user', decodeURIComponent('$cleanUser'));" else ""}
                            window.location.href = '/';
                        } catch(e) {
                            console.error('Deep link auth error', e);
                        }
                    })();
                """.trimIndent()
                webView.postDelayed({
                    webView.evaluateJavascript(js, null)
                }, 600)
            }
        }
    }

    override fun onDestroy() {
        stopCallRingtoneInternal()
        webView.destroy()
        super.onDestroy()
    }
}
