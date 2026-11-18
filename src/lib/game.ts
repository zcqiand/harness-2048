/** 棋盘滑动/合并纯逻辑——本任务只含单行滑动合并；方向提取/回注与整盘引擎随后续任务灌入。 */

/** 单行左滑动：非零压左 → 相邻同值合并一次 → 右侧补零。gained = 合并产生值之和。 */
export function slideLine(line: number[]): { line: number[]; gained: number } {
  const tiles = line.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      const merged = tiles[i] * 2;
      out.push(merged);
      gained += merged;
      i++; // 合并一次规则：被合并的partner不再参与
    } else {
      out.push(tiles[i]);
    }
  }
  while (out.length < line.length) {
    out.push(0);
  }
  return { line: out, gained };
}
