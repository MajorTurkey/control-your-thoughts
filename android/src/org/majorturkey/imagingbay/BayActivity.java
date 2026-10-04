package org.majorturkey.imagingbay;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class BayActivity extends Activity {
    private static final String HOME = "https://imaging-bay.vercel.app/";
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        String agent = settings.getUserAgentString();
        if (agent != null) settings.setUserAgentString(agent.replace("; wv", "") + " ImagingBay");
        final CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openOutside(request.getUrl());
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(
                String url,
                String userAgent,
                String contentDisposition,
                String mimetype,
                long contentLength
            ) {
                String name = URLUtil.guessFileName(url, contentDisposition, mimetype);
                String folder = folderName(Uri.parse(url).getQueryParameter("folder"));
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.addRequestHeader("User-Agent", userAgent);
                String cookie = cookies.getCookie(url);
                if (cookie != null) request.addRequestHeader("Cookie", cookie);
                if (mimetype != null) request.setMimeType(mimetype);
                request.setTitle(name);
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(publicDir(folder), name);
                DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                if (manager == null) return;
                manager.enqueue(request);
                Toast.makeText(BayActivity.this, "Saving to " + folder, Toast.LENGTH_SHORT).show();
            }
        });
        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        }
        handleIntent(getIntent(), savedInstanceState == null);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent, false);
    }

    private static String publicDir(String folder) {
        if ("Pictures".equals(folder)) return Environment.DIRECTORY_PICTURES;
        if ("Documents".equals(folder)) return Environment.DIRECTORY_DOCUMENTS;
        if ("Camera".equals(folder)) return Environment.DIRECTORY_DCIM;
        return Environment.DIRECTORY_DOWNLOADS;
    }

    private static String folderName(String folder) {
        if ("pictures".equals(folder)) return "Pictures";
        if ("documents".equals(folder)) return "Documents";
        if ("dcim".equals(folder)) return "Camera";
        return "Downloads";
    }

    private void handleIntent(Intent intent, boolean fresh) {
        if (intent != null) {
            String handoff = intent.getStringExtra("handoff");
            if (handoff != null && !handoff.isEmpty()) {
                loadClaim(handoff);
                return;
            }
            Uri data = intent.getData();
            if (isReturn(data)) {
                acceptSession(data);
                return;
            }
        }
        if (!fresh) return;
        webView.loadUrl(HOME);
    }

    private boolean isReturn(Uri data) {
        if (data == null) return false;
        if ("imagingbay".equals(data.getScheme())) return true;
        String path = data.getPath() == null ? "" : data.getPath();
        return "https".equals(data.getScheme())
            && "imaging-bay.vercel.app".equals(data.getHost())
            && path.startsWith("/auth/open");
    }

    private void acceptSession(Uri data) {
        String handoff = data.getQueryParameter("h");
        if (handoff == null || handoff.isEmpty()) handoff = data.getFragment();
        if (handoff != null && !handoff.isEmpty()) {
            loadClaim(handoff);
            return;
        }
        webView.loadUrl(HOME);
    }

    private void loadClaim(String handoff) {
        webView.loadUrl("https://imaging-bay.vercel.app/auth/claim?h=" + Uri.encode(handoff));
    }

    private boolean openOutside(Uri uri) {
        if (uri == null) return false;
        String host = uri.getHost();
        if (host == null) return false;
        String name = host.toLowerCase();
        String path = uri.getPath() == null ? "" : uri.getPath();
        boolean handoff = name.equals("imaging-bay.vercel.app") && path.startsWith("/auth/start");
        boolean auth = name.equals("auth.grok.me")
            || name.equals("accounts.google.com")
            || name.endsWith(".accounts.google.com")
            || name.equals("x.com")
            || name.endsWith(".x.com")
            || name.equals("twitter.com")
            || name.endsWith(".twitter.com");
        if (!auth && !handoff) return false;
        startActivity(new Intent(Intent.ACTION_VIEW, uri));
        return true;
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }
}
