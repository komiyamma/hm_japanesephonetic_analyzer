// 秀丸 v8.66 以上
// hmV8 1.475 以上
// (C) 2017-2019 Akitsugu Komiyama

/// <reference path="./HmJapanesePhoneticAnalyzer.d.ts" />
// ライブラリの読み込み
host.lib( clr, "HmJapanesePhoneticAnalyzer");

// バッファー用の基本インターフェイス
class IDataBuffer {
    protected _all_text: string;
    protected _buffer_contains_ruby: boolean;
    constructor() {
        this._all_text = "";
        this._buffer_contains_ruby = false;
    }
    GetAllText(): string {
        return this._all_text;
    }

    AppendJapanesePhoneticAnalyzeData(record_list: IJapanesePhonetic[]): void {

        // 分かち書きされた各々のレコードやルビに対して…
        for(let record of record_list) {

            // 漢字に対するルビである
            if (record.IsPhraseStart) {
                // 各バッファーは自身のルビ振りのフォーマット変形を利用しながら、文字列を連結
                this.AddTextWithRuby(record.DisplayText, record.YomiText);
            } else {
                // 各バッファーは普通に文字列を連結
                this.AddTextOnly(record.DisplayText);
            }
        }
    }

    AddTextOnly(src: string): void {
        this._all_text += src;
    }
    AddTextWithRuby(src: string, ruby: string): void {
        this._buffer_contains_ruby = true;
        this._all_text += this.GetAddRubyFormat(src, ruby);
    }
    GetAddRubyFormat(src: string, ruby: string): string {
        return "Need Implements GetAddRubyFormat";
    }
    IsContainsRuby(): boolean {
        return this._buffer_contains_ruby === true;
    }
}

/**
 * 横にルビを振る用のバッファークラス
 * GetAddRubyFormatをoverride
 */
class YokoRubyDataBuffer extends IDataBuffer {
    GetAddRubyFormat(src: string, ruby: string): string {
        return src + "(" + ruby + ")";
    }
}


/**
 * HTMLでルビを振る用のバッファークラス
 * GetAddRubyFormatをoverride
 */
class HtmlRubyDataBuffer extends IDataBuffer {
    protected _htmlencoder: ((src: string)=>string);
    constructor() {
        super();

        let weblib: any = host.lib("System.Web");
        this._htmlencoder = weblib.System.Web.HttpUtility.HtmlEncode;
    }

    HtmlEncode(src: string): string {

        let html: string = this._htmlencoder(src);
        html = html.replace(/\r\n/g, "\r")
                   .replace(/\n/g, "\r")
                   .replace(/\r/g, "<br>\r\n")
                   .replace(/  /g, " &nbsp;")
        return html;
    }
    AddTextOnly(src: string) {
        this._all_text += this.HtmlEncode(src);
    }
    GetAddRubyFormat(src: string, ruby: string) {
        return "<ruby><rb>" + this.HtmlEncode(src) + "</rb><rp>(</rp><rt>" + ruby + "</rt><rp>)</rp></ruby>";
    }
}

// バッファーをMapに定義。キーは最終的にバッファー内容を秀丸マクロの変数へと書き込む際の変数名
let buffers: Map<string, IDataBuffer> = new Map<string, IDataBuffer>();
buffers.set( "$buf_text_with_rubied", new YokoRubyDataBuffer() );
buffers.set( "$buf_html_with_rubied", new HtmlRubyDataBuffer() );

// 変換対象の文字列取得の定義。
// 今のところ「通常の方法での選択したテキスト」
function GetTargetText(): string {
    if ( hm.Macro.Var["selecting"] ) {
        return hm.Edit.SelectedText;
    }
    return "";
};

// アウトプット枠への文字列出力
function OutputPane(text: string): void {
    hm.Macro.Var["$OutputPaneMessageText"] = text;
    hm.Macro.Eval( f => {
    /*
        #HMOP = loaddll(hidemarudir + @"\HmOutputPane.dll");
        #r = dllfunc(#HMOP, "Output", hidemaruhandle(0), $OutputPaneMessageText + "\r\n");
        freedll( #HMOP );
    */
    } );
}

// メイン処理
function Main(): void {

    // 変換対象となるテキスト全体を得る
    let target_text: string = GetTargetText();

    // 無ければさすがに窓を出して警告。終わり
    if (target_text.length === 0) {
        hm.Macro.Eval( f => {
        /*
            message("文字列が選択されていません。");
        */
        } );
        return;
    }

    // あまり長々とした文章を一気に変換することが出来ない(Windows APIの都合)
    // なので、普通に日本語書いていれば、このくらいの記号で分離すればよいだろう
    interface ISplitData {
        data_text: string;
        need_analyze:boolean;
    }
    let split_list: ISplitData[] = [];

    // 次に上げる条件で文字列を区切っていく。あまり長い文字列は JapanesePhoneticAnalyze が対処出来ないので。
    let breakPointRegexp: RegExp = /(.+?)([\s、／。・…？！（）【】『』「」＜＞\<\>\|\+\-\(\)\[\]\.\,\!\?\'\"]+|$)/g;
    let match_array: RegExpExecArray = null;
    while ((match_array = breakPointRegexp.exec(target_text)) != null) {

        // 通常の内容は、APIで分析する必要があるもの
        split_list.push({data_text:match_array[1], need_analyze:true });

        // 分離に使った最後の文字は、APIで分析する必要がないもの
        split_list.push({data_text:match_array[2], need_analyze:false});
    }

    // アナライザーのオブジェクト生成。
    let divider: HmJapanesePhoneticAnalyzer = new clr.HmJapanesePhoneticAnalyzer();

    // 事前にある程度分割しておいた文字列の各々で…
    for (let {data_text, need_analyze} of split_list) {

        // 分かち書きのAPIで分析する必要があるのであれば…
        if (need_analyze) {

            // 分析する。結果は「List<Windows.Globalization.JapanesePhoneme>」と同様のプロパティを持つもの。
            // 但し、DisplayTextは変換後全角データではなく、変換前のデータ、IsPhraseStartは「DisplayText」に漢字が含まれているかどうかのフラグ
            // というように少し意味を変えている。
            let record_list: IJapanesePhonetic[] = divider.GetJapanesePhoneticAnalyzeDataList(data_text);

            // 結果をバッファーへと足しこみ
            buffers.forEach(
                (buffer) => buffer.AppendJapanesePhoneticAnalyzeData(record_list)
            );

        // 分析する必要が無いのであれば、こちらもバッファーへと単純足しこみ
        } else {
            buffers.forEach(
                (buffer) => buffer.AddTextOnly(data_text)
            );
        }
    }

    AssignToHidemaruVarable();
}


function AssignToHidemaruVarable(): void {

    // で、結局最終的に秀丸の新ページとして出力するべきなの？
    let is_buf_contains_ruby:boolean = false;

    // ルビを持っているバッファがあるのであれば、出すべき
    buffers.forEach( (buffer) => { if (buffer.IsContainsRuby()) {is_buf_contains_ruby = true;} } );

    // 全バッファーにルビは含まれていない。アウトプット枠に情報を出すだけで終わり
    if (!is_buf_contains_ruby) {
        OutputPane("ルビ振りの対象となる文字列はありません");
        return;
    }

    // 全てのバッファーを「対応する秀丸マクロ変数」へと書き込み
    buffers.forEach(
        (buffer, name) => hm.Macro.Var[name] = buffer.GetAllText() 
    );

    // hmV8 1.475以上にしたいので、1:0を手書き。1.498以降であれば、Boolean値をそのまま代入できるのだが…
    hm.Macro.Var["#is_buf_contains_ruby"] = is_buf_contains_ruby ? 1 : 0;
}

Main();

