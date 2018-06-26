/**
 *
 * line-graph.js
 *
 */


 class Graph {

  /* コンストラクタ */
  constructor(svgId, data,
    margin={top: 20, right: 20, bottom: 20, left: 32}) {

    // SVG 要素を取得する
    let svg = d3.select(`#${svgId}`);
    this.svg = svg;
    this.width = parseInt(svg.style("width").replace("px", ""));
    this.height = parseInt(svg.style("height").replace("px", ""));

    // マージンの値をチェックする
    this.margin = Graph.checkMargin(margin);

    // 対象のデータ
    this.data = data;

    // x 方向のスケールを設定する
    this.x = this.setXScale();

    // y 方向のスケールを設定する
    this.y = this.setYScale();

    // x 軸を作成する
    this.xAxis = this.setXAxis();

    // y 軸を作成する
    this.yAxis = this.setYAxis();

    // x 方向の罫線のスタイルを設定する
    this.setXGridStyle();

    // x 方向の罫線のスタイルを設定する
    this.setYGridStyle();

    /* x 軸のパスのスタイルを設定する */
    this.setXAxisPathStyle();

    /* y 軸のパスのスタイルを設定する */
    this.setYAxisPathStyle();

  }

  /* マージンをチェックする ( 不正な値が指定されていないか ) */
  static checkMargin(margin) {
    let validKeys = ["top", "right", "bottom", "left"];
    let keys = Object.keys(margin);

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];

      // 不正なキーが含まれていないかどうかチェックする
      if (validKeys.indexOf(key) === -1) {
        let emsg = "Invalid margin key passed";
        throw new Error(emsg);
      }

      // 値が数値かどうかチェックする
      let val = margin[key];
      let isNumeric = !isNaN(parseFloat(val)) && isFinite(val);
      if (!isNumeric) {
        let emsg = "Invalid margin value";
        throw new Error(emsg);
      }

    }

    return margin;
  }

  /* 値が数値かどうか確認する */
  static isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  /* x 方向に相当するデータ値を 1 件取り出す */
  getX(d) {
    return d["at"];
  }

  /* x 方向のスケールを設定する */
  setXScale() {

    // データの先頭の値で使用するスケールを変える
    let peek = this.getX(this.data[0]);

    // 数値の場合
    let x;
    if (Graph.isNumeric(peek)) {
      // 数値の場合
      x = this.setXLinearScale();
    } else if (peek instanceof Date) {
      // 日付の場合
      x = this.setXTimeScale();
    }

    return x;
  }

  /* x 方向のスケールを設定する ( 数値のスケール ) */
  setXLinearScale() {

    // 開始 & 終了
    let start = this.getX(this.data[0]);
    let finish = this.getX(this.data[this.data.length - 1]);

    // x 方向のスケールを作成する
    let x = d3.scaleLinear()
      .domain([start, finish])
      .range([
        this.margin.left,
        this.width - this.margin.right,
      ]);

    return x;
  }

  /* x 方向のスケールを設定する ( 日時のスケール ) */
  setXTimeScale() {

    // データの先頭の日時 ~ 末尾の日時
    // つまり、日付 & 時刻でソートされていることが前提
    let start = this.getX(this.data[0]);
    let finish = this.getX(this.data[this.data.length - 1]);

    // x 方向のスケールを作成する
    let x = d3.scaleTime()
      .domain([start, finish])
      .range([
        this.margin.left,
        this.width - this.margin.right
      ]);

    return x;
  }

  /* y 方向に相当するデータ値を 1 件取り出す */
  getY(d) {
    return d["value"];
  }

  /* y 方向のスケールを設定する */
  setYScale() {

    // y 方向の最大値を取得する ( y 方向のスケールに影響する )
    let ys = this.data.map(this.getY);
    let yMax = Math.max(...ys);

    // y 方向のスケールを作成する
    let y = d3.scaleLinear()
      .domain([0, yMax])
      .range([
        this.height - this.margin.bottom,
        this.margin.top
      ])

    return y;
  }

  /* x 軸の目盛りのフォーマット用関数 */
  setXTickFormat(d, i) {
    return d.toLocaleString().substring(5);
  }

  /* x 軸を作成する */
  setXAxis() {

    return this.svg.append("g")
      .attr("class", "x-axis")
      .attr(
        "transform",
        "translate(" + 
          [
            0,
            this.height - this.margin.bottom
          ].join(",") + ")"
      )
      .call(
        d3.axisBottom(this.x)
          .ticks(4)    // ※これどうする?
          .tickSize(-this.height + this.margin.top + this.margin.bottom)
          .tickFormat(this.setXTickFormat)
      );

  }

  /* y 軸の目盛りのフォーマット用関数 */
  setYTickFormat(d, i) {
    return i;
  }

  /* y 軸を作成する */
  setYAxis() {

    return this.svg.append("g")
      .attr("class", "y-axis")
      .attr(
        "transform",
        "translate(" + 
          [
            this.margin.left,
            0
          ].join(",") + ")"
      )
      .call(
        d3.axisLeft(this.y)
          .ticks(4)    // ※これどうする?
          .tickSize(-this.width + this.margin.left + this.margin.right)
          .tickFormat(this.setYTickFormat)
      );

  }

  /* x 方向 or y 方向の罫線のスタイルを設定する */
  setGridStyle(axisClass, colorSetter) {
    this.svg.selectAll(`g.${axisClass} line`)
      .attr("stroke", colorSetter)
      .attr("stroke-opacity", 0.7)
      .attr("shape-rendering", "crispEdges");
  }

  /* x 方向の目盛りの色を設定する */
  setXAxisColor(d, i) {
    return "lightgray";
  }

  /* x 方向の罫線のスタイルを設定する */
  setXGridStyle() {
    this.setGridStyle("x-axis", this.setXAxisColor);
  }

  /* y 方向の目盛りの色を設定する */
  setYAxisColor(d, i) {
    return "lightgray";
  }

  /* y 方向の目盛りのスタイルを設定する */
  setYGridStyle() {
    this.setGridStyle("y-axis", this.setYAxisColor);
  }

  /* x 軸または y 軸のパスのスタイルを設定する */
  setAxisPathStyle(axisClass) {
    this.svg.selectAll(`g.${axisClass} path`)
      .attr("stroke", "lightgray")
      .attr("stroke-width", "1px");
  }

  /* x 軸のパスのスタイルを設定する */
  setXAxisPathStyle() {
    this.setAxisPathStyle("x-axis")
  }

  /* y 軸のパスのスタイルを設定する */
  setYAxisPathStyle() {
    this.setAxisPathStyle("y-axis")
  }

}


class LineGraph extends Graph {

  /* コンストラクタ */
  constructor(svgId, data,
    margin={top: 20, right: 20, bottom: 20, left: 32}) {
    super(svgId, data, margin);

    // ※とりあえず動くところを
    let valueLineFunc = d3.line()
      .x(d => this.x(d.at))
      .y(d => this.y(d.value));
    let valueLine = this.svg.append("path")
      .data([this.data])
      .attr("class", "path-aaa")
      .attr("d", valueLineFunc)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", "1.5px");

  }

}

/* main */
let svgId = "graphArea";
let dataType = "date";
let data;
if (dataType === "date") {
  data = [
    {value: 10, at: new Date("2018-06-26 04:45:45")},
    {value: 13, at: new Date("2018-06-26 07:30:24")},
    {value: 11, at: new Date("2018-06-26 12:30:37")},
    {value: 25, at: new Date("2018-06-26 15:25:13")},
  ];
} else if (dataType === "numeric") {
  data = [
    {value: 10, at: 1},
    {value: 13, at: 5},
    {value: 11, at: 7},
    {value: 25, at: 13},
  ];
}
let lg = new LineGraph(svgId, data);
console.dir(lg);