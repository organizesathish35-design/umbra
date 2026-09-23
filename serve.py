#!/usr/bin/env python3
"""
UMBRA — local dev server.

The site is plain HTML/CSS/ES modules, but ES modules cannot be loaded
over file:// (the browser blocks them as cross-origin), so it needs to
be served over http. This does that, with caching turned off so edits
show up on reload.

    python serve.py            # http://localhost:5178
    python serve.py 8080       # pick a port
"""

import socket
import sys
import functools
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class Handler(SimpleHTTPRequestHandler):
    # The site loads ~25 small files, and the default HTTP/1.0 closes the
    # connection after each one. Combined with Nagle's algorithm that cost
    # ~250ms per request here, which turned the module graph into a
    # multi-second waterfall and made local timings meaningless.
    protocol_version = "HTTP/1.1"
    disable_nagle_algorithm = True

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        # Serve the styled 404 page for missing routes
        if code == 404 and (ROOT / "404.html").exists():
            body = (ROOT / "404.html").read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().send_error(code, message, explain)

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5178
    handler = functools.partial(Handler, directory=str(ROOT))
    url = f"http://localhost:{port}"

    # Bind dual-stack. Windows resolves "localhost" to ::1 first, and an
    # IPv4-only socket leaves the browser waiting out that refusal before
    # it retries 127.0.0.1 — ~200ms on every connection, which reads as a
    # slow site when it is only a slow bind.
    class DualStack(ThreadingHTTPServer):
        address_family = socket.AF_INET6

        def server_bind(self):
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
            super().server_bind()

    try:
        httpd = DualStack(("::", port), handler)
    except OSError:
        httpd = ThreadingHTTPServer(("127.0.0.1", port), handler)

    with httpd:
        print(f"\n  UMBRA — serving {ROOT.name} at {url}\n  Ctrl+C to stop\n")
        if "--open" in sys.argv:
            webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  stopped\n")


if __name__ == "__main__":
    main()
