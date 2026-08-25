export interface MemberInfo {
  name: string;
  color: string;
}

// 新しいメンバーが追加されるたびにこの順で色を割り当てる。
const COLOR_PALETTE = [
  "#4C6EF5",
  "#F76707",
  "#2F9E44",
  "#E64980",
  "#9C36B5",
  "#0CA678",
  "#F59F00",
  "#1971C2",
  "#E8590C",
  "#5C940D",
];

export function colorForIndex(index: number): string {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

export const DEFAULT_MEMBERS: MemberInfo[] = [
  { name: "佐藤", color: COLOR_PALETTE[0] },
  { name: "ジョンス", color: COLOR_PALETTE[1] },
  { name: "手島", color: COLOR_PALETTE[2] },
  { name: "飯田", color: COLOR_PALETTE[3] },
  { name: "正義", color: COLOR_PALETTE[4] },
];

export const MAX_MEMBER_NAME_LENGTH = 12;

export function validateNewMemberName(
  name: string,
  existing: MemberInfo[],
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "名前を入力してください。";
  if (trimmed.length > MAX_MEMBER_NAME_LENGTH) {
    return `名前は${MAX_MEMBER_NAME_LENGTH}文字以内にしてください。`;
  }
  if (existing.some((m) => m.name === trimmed)) {
    return "その名前はすでに登録されています。";
  }
  return null;
}
