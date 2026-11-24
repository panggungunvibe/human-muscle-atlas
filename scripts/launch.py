"""Serve the bundled anatomy atlas on a local loopback port."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlencode
import webbrowser


def main():
    parser = argparse.ArgumentParser(description="打开人体肌群解剖版")
    parser.add_argument("--muscle", help="肌肉名称或搜索词，如 腓肠肌")
    parser.add_argument("--open", action="store_true", help="在默认浏览器打开")
    parser.add_argument("--port", type=int, default=0, help="本机端口，默认自动分配")
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("端口须在 0 至 65535 之间")

    site = Path(__file__).resolve().parents[1] / "assets" / "atlas"
    for required in ("index.html", "models/atlas.glb"):
        if not (site / required).is_file():
            parser.exit(1, f"缺少图谱资源 {required}。请下载完整的 Skill 仓库。\n")

    handler = partial(SimpleHTTPRequestHandler, directory=str(site))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    except OSError as error:
        parser.exit(1, f"无法启动本机图谱服务：{error}\n")
    with server:
        url = f"http://127.0.0.1:{server.server_port}/"
        if args.muscle:
            url += "?" + urlencode({"q": args.muscle.strip()})
        print(url, flush=True)
        if args.open:
            webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
