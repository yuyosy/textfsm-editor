<p align="center">
  <a href="https://github.com/yuyosy/textfsm-editor" target="_blank" rel="noopener noreferrer">
    <img width="180" src="pictures/icon.svg" alt="TextFSM Editor logo">
  </a>
</p>

# TextFSM Editor

ネットワークエンジニアや開発者が TextFSM テンプレートを作成・検証できる Web アプリです。テンプレートを入力し、サンプルデータを適用して、表形式や JSON 形式で結果を確認できます。

English version: [README.md](README.md)

> [!NOTE]
>
> 本プロジェクトは開発途中です。実装や性能の改善余地があり、セキュリティ面や運用面の強化が必要な場合があります。

![screenshot1](pictures/editor.png)

## 機能

### エディタ機能

- 🎨 インターフェーステーマ  
  - ライトモードとダークモードのサポート
- 📝 高度なエディタ統合 (Monaco Editor)  
  - TextFSM の構文ハイライト
  - 単語補完
  - コードの折りたたみとミニマップナビゲーション
- 📄 ファイルダウンロード  
  - 入力データおよび結果データのファイル出力
- 📋 クリップボード連携  
  - ワンクリックコピー機能

### パース機能

- ⚡ リアルタイムでのテンプレート適用
  - 変更に対する即時フィードバック
  - エラー検出機能
- 🔍 複数のデータ表示オプション  
  - テーブル表示による構造化データの確認
  - JSON 表示によるプログラム的アクセス
- 🕰️ パースの履歴  
  - 入力値、テンプレート、結果を一時的に LocalStorage に保存

### テンプレート管理

- 🗃️ プリセット読み込み  
  - NTC Templates からのテンプレート読み込み
  - 正規表現やあいまい検索によるテンプレート検索
- 🗂️ テンプレート管理  
  - LocalStorage へのテンプレート保存・読み込み
- 🖇️ インポート／エクスポート  
  - ファイルからのテンプレート読み込み
  - ファイルへのテンプレート出力

テーマ機能
![interface theme](pictures/editor-theme.png)

シンタックスハイライトと補完機能
![Word suggestion and code highlight](pictures/feature-highlight-suggetion.png)

パースしたデータのテーブル形式での表示
![Table display of parsed data](pictures/feature-result-table-view.png)

パースしたデータのJSON形式での表示
![JSON display of parsed data](pictures/feature-result-json-view.png)

その他エディタの機能
![Editor features](pictures/editor-features.png)

## プロジェクト構成

```text
textfsm-editor/
├ backend/                              # FastAPI バックエンド
│   ├ src/                               # Python アプリケーションコード
│   ├ public/                            # 静的アセットと生成物
│   ├ pyproject.toml                     # Python の依存関係と設定
│   ├ Dockerfile                         # バックエンド用コンテナ定義
│   └ ...
├ frontend/                             # React フロントエンド
│   ├ src/                               # TypeScript アプリケーションコード
│   ├ public/                            # Vite が扱う静的アセット
│   ├ package.json                       # フロントエンドの依存関係とスクリプト
│   └ ...
├ docker-compose.yml                    # Docker 環境設定
├ README.md                             # 英語版 README
├ README.ja.md                          # 日本語版 README
├ CONTRIBUTING.md                       # 開発と貢献のガイド
├ textfsm-editor.code-workspace
├ pictures/                             # 画像素材
└ ...
```

VS Code で `textfsm-editor.code-workspace` を開くと、両方のアプリをまとめて開発できます。

## はじめ方

### 前提条件

- Node.js 20+ と npm
- Python 3.12+
- Backend 用の依存関係管理に `uv`
- Docker + Docker Compose（任意）

### 依存関係のインストール

```bash
git clone https://github.com/yuyosy/textfsm-editor.git
cd textfsm-editor

cd frontend
npm install

cd ../backend
uv sync
```

### 開発モードで起動

別々のターミナルで次を実行してください。

```bash
# Terminal 1: フロントエンド（通常の開発モード）
cd frontend
npm run dev
```

```bash
# Terminal 2: バックエンド API
cd backend
uv run uvicorn src.main:app --reload
```

ブラウザ側で動く Pyodide モードでも起動できます。バックエンドなしでローカル処理を試したい場合は次を使います。

```bash
cd frontend
npm run dev -- --mode pyodide
```

これはブラウザ内で Python の TextFSM を実行する経路を確認するためのモードです。選択した処理方式はローカルストレージに保存されます。

アクセス先:

- フロントエンド: `http://localhost:5173`
- バックエンド API: `http://localhost:8000`

### ビルドモード

フロントエンドでは複数の処理方式を切り替えられます。

- `npm run build:backend` — 通常のバックエンド API 連携向けのビルド
- `npm run build:pyodide` — Pyodide を使うブラウザ静的ビルド
- `npm run build` — バックエンド向けビルドの実行
- `npm run build:deploy` — フロントエンドをビルドしてバックエンドへ配置

### Docker Compose を使う場合

```bash
docker compose --profile dev up --build --watch
```

コンテナ起動後は上記と同じ URL でアクセスできます。

## 本番ビルド

```bash
cd frontend
npm run build:deploy
```

このコマンドでフロントエンドをビルドし、生成した静的ファイルをバックエンド側へ配置します。その後、バックエンドを本番モードで起動します。

```bash
cd backend
MODE=production uv run uvicorn src.main:app --host 0.0.0.0 --port 8000
```

## 開発ガイド

セットアップ、品質確認、貢献手順については [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## ライセンス

MIT License. Copyright (c) 2023 yuyosy

## 参考

- [Monaco Editor](https://github.com/microsoft/monaco-editor)
- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [FastAPI](https://fastapi.tiangolo.com)
