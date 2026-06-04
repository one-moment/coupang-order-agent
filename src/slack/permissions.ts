export function isAllowedSlackRequest(userId: string, channelId: string): boolean {
  const allowedUsers = csv(process.env.SLACK_ALLOWED_USER_IDS);
  const allowedChannels = csv(process.env.SLACK_ALLOWED_CHANNEL_IDS);
  const userAllowed = allowedUsers.length === 0 || allowedUsers.includes(userId);
  const channelAllowed = allowedChannels.length === 0 || allowedChannels.includes(channelId);
  return userAllowed && channelAllowed;
}

function csv(value?: string): string[] {
  return (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}
