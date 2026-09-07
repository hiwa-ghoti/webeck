# WEBECK

「アニメーションそのものをUIにする」1画面のローカルプロトタイプ。

## 起動

Node.js 20.9以上（検証環境: Node.js 24）を使用。

```powershell
cd C:\create\webeck
npm install
npm run dev
```

http://localhost:3000 を開く。使用中の場合はターミナルに表示されたポートへアクセス。

```powershell
npm run typecheck
npm run build
npm start
```

本番起動の前に開発サーバーを停止するか、`npm start -- --port 3001` を使用。

## GitHub Pages

`main` ブランチへ更新を送ると、`.github/workflows/deploy-pages.yml` が静的サイトを生成してGitHub Pagesへ公開する。リポジトリの Settings → Pages → Build and deployment は **GitHub Actions** を選択する。

## 実装

- Next.js App Router + TypeScript / React Three Fiber / Three.js / Drei / GSAP。
- 約3秒間、暗い背景にWEBECKが出現して消え、中央に金属光沢のトーラスノットが現れる。
- 微浮遊・自転・カーソル反応・押下時の収縮。
- Pointer Eventsとpointer captureによるマウス/タッチ回転。離すと減衰する慣性。長く止めてから離した場合は勢いを残さない。
- 速度に連動して発光、青→紫→ピンク、粒子、背景の光が段階的に強まる。フレームごとのReact再描画は行わない。
- ポインターの速度に反応する2Dの液体光リボン、色収差、衝撃波を3D空間の上に合成。
- 矢印キーで回転、スペースで慣性停止。画面上の操作説明なし、支援技術用ラベルあり。
- 動きを減らすOS設定では自動浮遊・自転を停止し、反応の強さを抑制。
- 外部3Dモデル・画像・フォントのダウンロード不要。環境光も手続き的に生成。

## 調整

`src/components/Experience.tsx`: 形状、材質、減衰、各演出の閾値、イントロ時間。
`src/app/globals.css`: 全画面レイアウトとイントロの文字組み。

スマートフォンで確認する場合はPCと同じLANから `http://PCのLAN内IP:3000` にアクセス（必要に応じてOSのファイアウォール設定）。実機の描画性能に合わせてCanvasのdprやジオメトリ分割数を調整。

音声、別ページ、保存、ログインはこのファーストビューの範囲外。WebGL非対応時は案内を表示。
