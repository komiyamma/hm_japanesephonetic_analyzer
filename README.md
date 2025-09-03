# HmJapanesePhoneticAnalyzer

![HmJapanesePhoneticAnalyzer v1.0.0](https://img.shields.io/badge/HmJapanesePhoneticAnalyzer-v1.0.0-6479ff.svg)
[![Apache 2.0](https://img.shields.io/badge/license-Apache_2.0-blue.svg?style=flat)](License.txt)
![Hidemaru 8.66](https://img.shields.io/badge/Hidemaru-v8.66-6479ff.svg)

## 概要

このプログラムは、漢字とひらがなの組み合わせである日本語の文字列を読み取り、「分かち書き分割」や「ルビ振り」を「自動的に行う」ための秀丸マクロ・コンポーネントです。

Windowsに標準で搭載されている `Windows.Globalization.JapanesePhoneticAnalyzer` API を利用して、高精度なかな変換を実現します。

## 機能

選択した日本語の文章に対して、以下の2つの形式でルビを振った結果を生成します。

### 1. 横ルビ形式
文章中の漢字部分に、括弧書きで読み仮名を追記します。

**変換前の文章:**
> 吾輩は猫である。名前はまだ無い。

**変換後の文章:**
> 吾輩(わがはい)は猫(ねこ)である。名前(なまえ)はまだ無(な)い。

### 2. HTMLルビ形式
HTMLの `<ruby>` タグを使用して、ウェブページなどで表示可能なルビ付きのテキストを生成します。

**変換前の文章:**
> 吾輩は猫である。名前はまだ無い。

**変換後の文章:**
> <ruby><rb>吾輩</rb><rp>(</rp><rt>わがはい</rt><rp>)</rp></ruby>は<ruby><rb>猫</rb><rp>(</rp><rt>ねこ</rt><rp>)</rp></ruby>である。<ruby><rb>名前</rb><rp>(</rp><rt>なまえ</rt><rp>)</rp></ruby>はまだ<ruby><rb>無</rb><rp>(</rp><rt>な</rt><rp>)</rp></ruby>い。

## 動作環境

- **秀丸エディタ**: Ver 8.66 以上
- **hmV8**: Ver 1.475 以上
- **OS**: Windows 8 以降 (`Windows.Globalization` API が利用可能な環境)

## インストール方法

1.  リポジトリのルートにある以下の2つのファイルをダウンロードします。
    - `HmJapanesePhoneticAnalyzer.dll`
    - `HmJapanesePhoneticAnalyzer.mac`
2.  秀丸エディタのインストールフォルダ（`C:\Program Files\Hidemaru` など）の中にあるマクロ用のフォルダに、上記2つのファイルをコピーします。
    - マクロ用のフォルダの場所がわからない場合は、秀丸エディタの `マクロ(M)` > `マクロ登録(E)` で表示される画面で確認できます。

## 使い方

1.  秀丸エディタで、ルビを振りたい文章を開きます。
2.  ルビを振りたい範囲を選択します。
3.  `マクロ(M)` > `マクロの実行` から `HmJapanesePhoneticAnalyzer.mac` を選択して実行します。
4.  マクロが実行されると、変換結果を含む2つの変数（`$buf_text_with_rubied`, `$buf_html_with_rubied`）が秀丸マクロ内で利用可能になります。
    - このマクロは、標準では変換結果を直接表示しません。他のマクロから呼び出して利用することを想定しています。

## ライセンス

このソフトウェアは、[Apache License 2.0](License.txt) の下で公開されています。

## その他

より詳しい情報や更新については、以下のページもご覧ください。

[https://秀丸マクロ.net/?page=nobu_tool_hm_japanesephonetic_analyzer](https://秀丸マクロ.net/?page=nobu_tool_hm_japanesephonetic_analyzer)