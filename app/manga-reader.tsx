import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCbzRequire } from '@/src/manga/asset-map';
import { getRemoteCbzUrl } from '@/src/manga/remote-cbz-map';

const LOAD_TIMEOUT_MS = 35_000;
const ASSET_DOWNLOAD_TIMEOUT_MS = 12_000;
const REMOTE_DOWNLOAD_TIMEOUT_MS = 180_000;
const MAX_INJECT_SIZE = 12 * 1024 * 1024;
const WEBVIEW_FETCH_TIMEOUT_MS = 120_000;
const REMOTE_CACHE_SUBDIR = 'cbz-cache';

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}
function isGoogleDriveUrl(url: string): boolean {
  try {
    const host = new URL(url).host;
    return host.includes('drive.google.com') || host.includes('drive.usercontent.google.com');
  } catch {
    return false;
  }
}

function parseGoogleDriveDownloadUrlFromHtml(html: string, pageUrl: string): string | null {
  const formMatch = html.match(/<form[^>]+id="download-form"[^>]+action="([^"]+)"/i);
  if (!formMatch?.[1]) return null;

  const action = formMatch[1].replace(/&amp;/g, '&');
  const actionUrl = new URL(action, pageUrl);
  const params = new URLSearchParams(actionUrl.search);
  const inputRegex = /<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"/gi;
  let match: RegExpExecArray | null;
  while ((match = inputRegex.exec(html)) !== null) {
    const name = match[1];
    const value = match[2].replace(/&amp;/g, '&');
    params.set(name, value);
  }

  const query = params.toString();
  return query
    ? `${actionUrl.origin}${actionUrl.pathname}?${query}`
    : `${actionUrl.origin}${actionUrl.pathname}`;
}

async function resolveRemoteCbzUrl(url: string): Promise<string> {
  if (!isGoogleDriveUrl(url)) return url;

  try {
    const response = await withTimeout(fetch(url), ASSET_DOWNLOAD_TIMEOUT_MS, 'Drive link resolve');
    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    if (!contentType.includes('text/html')) {
      return response.url || url;
    }

    const html = await response.text();
    const resolved = parseGoogleDriveDownloadUrlFromHtml(html, response.url || url);
    return resolved ?? (response.url || url);
  } catch {
    return url;
  }
}

function isLikelyZipBase64(base64: string): boolean {
  return /^UEs[DBBQ]/.test(base64);
}

function getRemoteCachePath(folder: string, cbzFilename: string): string | null {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) return null;
  const safeKey = encodeURIComponent(`${folder}__${cbzFilename}`);
  return `${cacheDir}${REMOTE_CACHE_SUBDIR}/${safeKey}.cbz`;
}

function getDirectoryPath(path: string): string {
  const index = path.lastIndexOf('/');
  return index === -1 ? path : path.slice(0, index);
}

/** Injected into WebView so console.error and window.onerror are forwarded to RN for debugging */
const WEBVIEW_ERROR_SCRIPT = `
  (function(){
    var send = function(m) {
      try { if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) window.ReactNativeWebView.postMessage(JSON.stringify({ t: 'err', m: m })); } catch(e) {}
    };
    window.onerror = function(msg, url, line, col, err) {
      send('[onerror] ' + msg + (url ? ' at ' + url + ':' + line : ''));
      return false;
    };
    var orig = console.error;
    console.error = function() {
      send('[console.error] ' + Array.prototype.slice.call(arguments).join(' '));
      if (orig) orig.apply(console, arguments);
    };
  })();
`;

export default function MangaReaderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    folder: string;
    cbz: string;
    title: string;
  }>();
  const folder = params.folder ? decodeURIComponent(params.folder) : '';
  const cbzFilename = params.cbz ? decodeURIComponent(params.cbz) : '';
  const title = params.title ? decodeURIComponent(params.title) : 'Manga';

  const [cbzUri, setCbzUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadStep, setLoadStep] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [cbzBase64, setCbzBase64] = useState<string | null>(null);
  const [webFallbackUri, setWebFallbackUri] = useState<string | null>(null);
  const [injectMode, setInjectMode] = useState<'base64' | 'url' | null>(null);

  const loadCbz = useCallback(async () => {
    const mod = getCbzRequire(folder, cbzFilename);
    const remoteUrl = getRemoteCbzUrl(folder, cbzFilename);
    if (!mod && !remoteUrl) {
      setError('CBZ not configured for this volume.');
      setLoading(false);
      return;
    }
    const timeoutId = setTimeout(() => {
      setError('Opening took too long. Check that the device can reach the dev server.');
      setLoading(false);
    }, LOAD_TIMEOUT_MS);

    try {
      setLoadStep('Preparing...');
      setError(null);
      setCbzBase64(null);
      setWebFallbackUri(null);
      if (__DEV__) console.log('[CBZ] step: Preparing');
      let uri: string | null = null;
      if (mod) {
        const asset = Asset.fromModule(mod);
        try {
          await withTimeout(
            asset.downloadAsync(),
            ASSET_DOWNLOAD_TIMEOUT_MS,
            'Asset download'
          );
        } catch (e) {
          if (__DEV__) console.warn('[CBZ] asset.downloadAsync failed or timed out, using uri:', e);
        }
        uri = asset.localUri ?? asset.uri ?? null;
      } else {
        uri = await resolveRemoteCbzUrl(remoteUrl);
      }
      if (!uri) {
        clearTimeout(timeoutId);
        setError('Could not resolve CBZ URI.');
        setLoading(false);
        return;
      }
      setCbzUri(uri);
      if (__DEV__) console.log('[CBZ] uri:', uri.startsWith('file://') ? 'file' : 'http');
      setLoadStep('Opening...');

      if (uri.startsWith('file://')) {
        setLoadStep('Reading...');
        if (__DEV__) console.log('[CBZ] step: Reading file');
        const info = await FileSystem.getInfoAsync(uri);
        const size = info.exists && 'size' in info ? (info as { size: number }).size : 0;
        if (size > MAX_INJECT_SIZE) {
          clearTimeout(timeoutId);
          const sizeMB = Math.round(size / 1024 / 1024);
          setError(
            `This volume is too large (${sizeMB}MB). The reader supports up to ${MAX_INJECT_SIZE / 1024 / 1024}MB. Try a smaller volume, or use a built app (eas build) for large files.`
          );
          setLoading(false);
          return;
        }
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        if (__DEV__) console.log('[CBZ] step: Done (base64)');
        setCbzBase64(base64);
        setInjectMode('base64');
      } else {
        const cachePath = getRemoteCachePath(folder, cbzFilename);
        let localPath: string | null = null;
        let downloadedToCache = false;
        try {
          if (cachePath) {
            setLoadStep('Checking cache...');
            const cachedInfo = await FileSystem.getInfoAsync(cachePath);
            const cachedSize = cachedInfo.exists && 'size' in cachedInfo ? (cachedInfo as { size: number }).size : 0;
            if (cachedInfo.exists && cachedSize > 0) {
              localPath = cachePath;
              if (__DEV__) console.log('[CBZ] step: Using cached file');
            } else {
              setLoadStep('Downloading...');
              if (__DEV__) console.log('[CBZ] step: Downloading to cache');
              await FileSystem.makeDirectoryAsync(getDirectoryPath(cachePath), { intermediates: true });
              const downloadTimeout = isGoogleDriveUrl(uri) ? REMOTE_DOWNLOAD_TIMEOUT_MS : ASSET_DOWNLOAD_TIMEOUT_MS;
              await withTimeout(
                FileSystem.downloadAsync(uri, cachePath),
                downloadTimeout,
                'CBZ download'
              );
              localPath = cachePath;
              downloadedToCache = true;
            }
          }

          if (!localPath) {
            if (__DEV__) console.warn('[CBZ] no cache directory, using URL mode');
            setInjectMode('url');
            return;
          }

          setCbzUri(localPath);
          setWebFallbackUri(uri);
          setLoadStep('Reading...');
          const info = await FileSystem.getInfoAsync(localPath);
          const size = info.exists && 'size' in info ? (info as { size: number }).size : 0;
          if (size > MAX_INJECT_SIZE) {
            setCbzUri(uri);
            setWebFallbackUri(null);
            setInjectMode('url');
            return;
          }
          const base64 = await FileSystem.readAsStringAsync(localPath, { encoding: 'base64' });
          if (!isLikelyZipBase64(base64)) {
            if (downloadedToCache) {
              await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
            }
            throw new Error('Downloaded file is not a valid CBZ archive. Google Drive returned an HTML warning page.');
          }
          if (__DEV__) console.log('[CBZ] step: Done (base64)');
          setCbzBase64(base64);
          setInjectMode('base64');
        } catch (e) {
          const message = e instanceof Error ? e.message : '';
          if (message.includes('not a valid CBZ archive')) {
            setError(message);
            return;
          }
          if (downloadedToCache && localPath) {
            await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
          }
          if (__DEV__) console.warn('[CBZ] download/read failed, falling back to URL mode:', e);
          setCbzUri(uri);
          setWebFallbackUri(null);
          setInjectMode('url');
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load CBZ');
      if (__DEV__) console.warn('[CBZ] load error:', e);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [folder, cbzFilename]);

  useEffect(() => {
    loadCbz();
  }, [loadCbz]);

  if (error || (!loading && !cbzUri)) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">Could not open CBZ</ThemedText>
        <ThemedText style={styles.errorText}>{error ?? 'Missing URI'}</ThemedText>
        <ThemedText style={styles.hintText}>
          Same network? For dev builds run npx expo start --tunnel on PC, or allow port 8081 in Windows Firewall. For large volumes, wait for cache download and retry.
        </ThemedText>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ThemedText type="defaultSemiBold">Back</ThemedText>
        </Pressable>
        <Pressable style={[styles.backButton, { marginTop: 8 }]} onPress={() => { setError(null); setCbzBase64(null); setWebFallbackUri(null); setLoading(true); setInjectMode(null); loadCbz(); }}>
          <ThemedText type="defaultSemiBold">Retry</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (loading || injectMode === null) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>{loadStep}</ThemedText>
      </ThemedView>
    );
  }

  const html =
    injectMode === 'base64' && cbzBase64
      ? getCbzViewerHtmlWithBase64(cbzBase64)
      : getCbzViewerHtml(cbzUri!, webFallbackUri ?? undefined);
  // When using URL, set baseUrl so same-origin fetch is allowed
  let baseUrl: string | undefined;
  if (injectMode === 'url' && cbzUri && /^https?:\/\//i.test(cbzUri)) {
    try {
      baseUrl = new URL(cbzUri).origin + '/';
    } catch {
      baseUrl = undefined;
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBack}>
          <ThemedText type="defaultSemiBold">{'<- Back'}</ThemedText>
        </Pressable>
        <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.headerTitle}>
          {title}
        </ThemedText>
      </ThemedView>
      <WebView
        source={baseUrl ? { html, baseUrl } : { html }}
        style={styles.webview}
        originWhitelist={['*']}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        scrollEnabled
        nestedScrollEnabled
        onMessage={({ nativeEvent: { data } }) => {
          try {
            const d = JSON.parse(data);
            if (d?.t === 'err' && d?.m) console.warn('[CBZ WebView]', d.m);
          } catch {
            // ignore
          }
        }}
      />
    </ThemedView>
  );
}

function getCbzViewerHtmlWithBase64(cbzBase64: string): string {
  // Escape for embedding in JS string: backslash and </script>
  const escaped = cbzBase64.replace(/\\/g, '\\\\').replace(/<\/script/gi, '<\\/script');
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=4,user-scalable=yes"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#111;color:#eee;font-family:system-ui,sans-serif}
    #status{padding:20px;text-align:center}
    #pages{display:flex;flex-direction:column;align-items:center;padding:8px 0 24px}
    #pages img{max-width:100%;height:auto;display:block;margin-bottom:4px}
  </style>
</head>
<body>
  <div id="status">Opening archive...</div>
  <div id="pages"></div>
  <script>${WEBVIEW_ERROR_SCRIPT}</script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script>
    (function() {
      var status = document.getElementById('status');
      if (typeof JSZip === 'undefined') {
        status.textContent = 'JSZip failed to load (check internet).';
        return;
      }
      var cbzBase64 = "${escaped}";
      var container = document.getElementById('pages');
      var imageExt = /\\.(jpg|jpeg|png|gif|webp|bmp)$/i;
      function naturalSort(names) {
        return names.slice().sort(function(a, b) {
          var aNum = a.replace(/\\D/g, '');
          var bNum = b.replace(/\\D/g, '');
          if (aNum !== bNum) return parseInt(aNum || '0', 10) - parseInt(bNum || '0', 10);
          return a.localeCompare(b);
        });
      }
      JSZip.loadAsync(cbzBase64, { base64: true }).then(function(zip) {
        var names = Object.keys(zip.files).filter(function(n) {
          return !zip.files[n].dir && imageExt.test(n);
        });
        var sorted = naturalSort(names);
        status.textContent = 'Loading pages (0 / ' + sorted.length + ')...';
        var done = 0;
        function next(i) {
          if (i >= sorted.length) {
            status.style.display = 'none';
            return;
          }
          var name = sorted[i];
          zip.files[name].async('base64').then(function(b64) {
            var ext = (name.split('.').pop() || 'jpg').toLowerCase();
            var mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
            var img = document.createElement('img');
            img.src = 'data:' + mime + ';base64,' + b64;
            img.alt = 'Page ' + (i + 1);
            container.appendChild(img);
            done++;
            status.textContent = 'Loading pages (' + done + ' / ' + sorted.length + ')...';
            next(i + 1);
          }).catch(function(e) {
            status.textContent = 'Error: ' + e.message;
          });
        }
        next(0);
      }).catch(function(e) {
        status.textContent = 'Error: ' + e.message;
      });
    })();
  </script>
</body>
</html>`;
}

function getCbzViewerHtml(cbzUrl: string, fallbackCbzUrl?: string): string {
  const escapedUrl = cbzUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const escapedFallbackUrl = (fallbackCbzUrl ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=4,user-scalable=yes"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#111;color:#eee;font-family:system-ui,sans-serif}
    #status{padding:20px;text-align:center}
    #pages{display:flex;flex-direction:column;align-items:center;padding:8px 0 24px}
    #pages img{max-width:100%;height:auto;display:block;margin-bottom:4px}
  </style>
</head>
<body>
  <div id="status">Loading CBZ...</div>
  <div id="pages"></div>
  <script>${WEBVIEW_ERROR_SCRIPT}</script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script>
    (function() {
      var status = document.getElementById('status');
      if (typeof JSZip === 'undefined') {
        status.textContent = 'JSZip failed to load (check internet).';
        return;
      }
      var cbzUrl = "${escapedUrl}";
      var fallbackCbzUrl = "${escapedFallbackUrl}";
      var container = document.getElementById('pages');
      var imageExt = /\\.(jpg|jpeg|png|gif|webp|bmp)$/i;
      function naturalSort(names) {
        return names.slice().sort(function(a, b) {
          var aNum = a.replace(/\\D/g, '');
          var bNum = b.replace(/\\D/g, '');
          if (aNum !== bNum) return parseInt(aNum || '0', 10) - parseInt(bNum || '0', 10);
          return a.localeCompare(b);
        });
      }
      var fetchTimeoutMs = ${WEBVIEW_FETCH_TIMEOUT_MS};
      function fetchCbzWithTimeout(url) {
        return Promise.race([
          fetch(url).then(function(r) {
            if (!r.ok) throw new Error('Fetch ' + r.status);
            return r.arrayBuffer();
          }),
          new Promise(function(_, reject) {
            setTimeout(function() {
              reject(new Error('Fetch timed out after ' + Math.round(fetchTimeoutMs / 1000) + 's. Try a faster/stable internet connection and retry. If this is a dev build, run: npx expo start --tunnel'));
            }, fetchTimeoutMs);
          })
        ]);
      }

      fetchCbzWithTimeout(cbzUrl).catch(function(primaryErr) {
        if (!fallbackCbzUrl || fallbackCbzUrl === cbzUrl) {
          throw primaryErr;
        }
        status.textContent = 'Local cache failed. Retrying remote...';
        return fetchCbzWithTimeout(fallbackCbzUrl);
      }).then(function(buf) {
        status.textContent = 'Opening archive...';
        return JSZip.loadAsync(buf);
      }).then(function(zip) {
        var names = Object.keys(zip.files).filter(function(n) {
          return !zip.files[n].dir && imageExt.test(n);
        });
        var sorted = naturalSort(names);
        status.textContent = 'Loading pages (0 / ' + sorted.length + ')...';
        var done = 0;
        function next(i) {
          if (i >= sorted.length) {
            status.style.display = 'none';
            return;
          }
          var name = sorted[i];
          zip.files[name].async('base64').then(function(b64) {
            var ext = (name.split('.').pop() || 'jpg').toLowerCase();
            var mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
            var img = document.createElement('img');
            img.src = 'data:' + mime + ';base64,' + b64;
            img.alt = 'Page ' + (i + 1);
            container.appendChild(img);
            done++;
            status.textContent = 'Loading pages (' + done + ' / ' + sorted.length + ')...';
            next(i + 1);
          }).catch(function(e) {
            status.textContent = 'Error: ' + e.message;
          });
        }
        next(0);
      }).catch(function(e) {
        status.textContent = 'Error: ' + e.message;
      });
    })();
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
  hintText: {
    marginTop: 12,
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  headerBack: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
