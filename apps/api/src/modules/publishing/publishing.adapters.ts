import { IntegrationEngine } from '../integrations/integrations.engine';
import { SupportedPlatform } from './publishing.engine';

type Media = { media_type: string; media_url: string };
type PostInput = { tenantId: string; content: string; media: Media[]; postType?: string };

export class ProviderConfigurationError extends Error {
  readonly code = 'PROVIDER_NOT_CONFIGURED';
}

const graphVersion = () => process.env.META_GRAPH_API_VERSION || 'v20.0';
const json = async (response: Response) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Provider request failed (${response.status}): ${body.error?.message || JSON.stringify(body)}`);
  return body;
};

async function credentials(tenantId: string, provider: string) {
  const value: any = await IntegrationEngine.getCredentials(tenantId, provider);
  if (!value?.access_token || !value.external_account_id) {
    throw new ProviderConfigurationError(`${provider} requires an active integration with an access token and external account ID`);
  }
  return value;
}

export async function publishMeta(platform: 'facebook' | 'instagram', input: PostInput) {
  const c = await credentials(input.tenantId, platform);
  const token = encodeURIComponent(c.access_token);
  if (platform === 'facebook') {
    const body: Record<string, string> = { message: input.content, access_token: c.access_token };
    if (input.media[0]?.media_url) body.link = input.media[0].media_url;
    const result = await json(await fetch(`https://graph.facebook.com/${graphVersion()}/${c.external_account_id}/feed`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
    return result.id as string;
  }
  const image = input.media.find(m => m.media_type === 'image');
  const video = input.media.find(m => m.media_type === 'video');
  const mediaUrl = video?.media_url || image?.media_url;
  if (!mediaUrl) throw new ProviderConfigurationError('Instagram publishing requires at least one public media URL');
  
  let mediaTypeParam = '';
  if (input.postType === 'story') mediaTypeParam = '&media_type=STORIES';
  else if (input.postType === 'reel') mediaTypeParam = '&media_type=REELS';
  
  const urlParam = video ? `video_url=${encodeURIComponent(mediaUrl)}` : `image_url=${encodeURIComponent(mediaUrl)}`;
  const container = await json(await fetch(`https://graph.facebook.com/${graphVersion()}/${c.external_account_id}/media?${urlParam}&caption=${encodeURIComponent(input.content)}${mediaTypeParam}&access_token=${token}`, { method: 'POST' }));
  const result = await json(await fetch(`https://graph.facebook.com/${graphVersion()}/${c.external_account_id}/media_publish?creation_id=${encodeURIComponent(container.id)}&access_token=${token}`, { method: 'POST' }));
  return result.id as string;
}

export async function publishLinkedIn(input: PostInput) {
  const c = await credentials(input.tenantId, 'linkedin');
  const author = c.external_account_id.startsWith('urn:') ? c.external_account_id : `urn:li:person:${c.external_account_id}`;
  const result = await json(await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${c.access_token}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
    body: JSON.stringify({ author, lifecycleState: 'PUBLISHED', specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text: input.content }, shareMediaCategory: 'NONE' } }, visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' } })
  }));
  return result.id as string;
}

export async function publishPlatform(platform: SupportedPlatform, input: PostInput) {
  return platform === 'linkedin' ? publishLinkedIn(input) : publishMeta(platform, input);
}
