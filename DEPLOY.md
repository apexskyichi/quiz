# 🌐 インターネットで公開する方法

## 方法1: Netlify（最も簡単・5分で完了）

### 手順：
1. **https://app.netlify.com/drop** にアクセス
2. **quiz-appフォルダ**をブラウザにドラッグ&ドロップ
3. 数秒待つと、URLが表示されます！
   例：`https://amazing-quiz-abc123.netlify.app`
4. このURLをiPhoneのSafariで開く
5. ホーム画面に追加

### メリット：
- アカウント作成不要（作ると管理しやすい）
- 完全無料
- 世界中どこからでもアクセス可能
- PCの電源を切っても大丈夫

---

## 方法2: GitHub Pages（プログラマー向け）

### 必要なもの：
- GitHubアカウント（無料）
- Git の基本知識

### 手順：
1. GitHubで新しいリポジトリを作成
2. quiz-appの中身をアップロード
3. Settings → Pages → Source を「Deploy from a branch」に
4. Branch を「main」、フォルダを「/ (root)」に設定
5. 数分待つと `https://あなたのID.github.io/リポジトリ名/` で公開

---

## 方法3: ローカルネットワーク拡張

### ngrok を使う（一時的な公開）
1. https://ngrok.com/ でアカウント作成
2. ngrokをダウンロード
3. ローカルサーバーを起動
4. `ngrok http 8000` を実行
5. 発行されたURLを使用（数時間有効）

---

## 📱 公開後の使い方

### iPhoneでPWAとして設定：
1. 公開されたURLをSafariで開く
2. 共有ボタン → ホーム画面に追加
3. **以降はネット接続なしでも使える！**

### データ更新方法：
- Netlify/GitHub Pagesに再アップロード
- アプリ内の「データ再読み込み」ボタンで更新

---

## ⚡ クイックスタート

今すぐ試したい場合：
1. **https://app.netlify.com/drop** を開く
2. quiz-appフォルダをドロップ
3. 完了！

たったこれだけで、世界中からアクセスできるアプリになります！
