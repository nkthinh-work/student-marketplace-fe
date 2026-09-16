/**
 * Canonical helper for resolving display name in GROUP chat context.
 * In a group, member's nickname takes precedence over canonical full_name.
 */
export function getGroupChatDisplayName(member: {
  nickname?: string | null;
  full_name: string;
}): string {
  return member.nickname?.trim() ? member.nickname.trim() : member.full_name;
}
