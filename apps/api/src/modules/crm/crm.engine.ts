import { supabaseAdmin } from '../../config/supabase';
import { normalizeEmail, normalizePhone } from './identity-matcher';

export interface ResolveContactParams {
  tenantId: string;
  provider: 'whatsapp' | 'instagram' | 'email' | 'sms' | 'facebook';
  providerId: string;
  profileData?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
}

export class CRMEngine {
  /**
   * Resolves a provider-specific identity (e.g. WhatsApp number) to a unified CRM Contact.
   * If the identity doesn't exist, it creates a new Contact and links the identity.
   */
  static async resolveIdentity(params: ResolveContactParams) {
    const { tenantId, provider, providerId, profileData } = params;

    // 1. Try to find existing identity mapping
    const { data: existingIdentity, error: identityError } = await supabaseAdmin
      .from('contact_identities')
      .select('contacts(*)')
      .eq('tenant_id', tenantId)
      .eq('provider', provider)
      .eq('provider_id', providerId)
      .single();

    if (existingIdentity && existingIdentity.contacts) {
      return existingIdentity.contacts; // Found existing contact
    }

    // 2. Match an existing contact by verified email/phone before creating a duplicate.
    const email = normalizeEmail(profileData?.email || (provider === 'email' ? providerId : undefined));
    const phone = normalizePhone(profileData?.phone || (provider === 'whatsapp' || provider === 'sms' ? providerId : undefined));
    let matched: any = null;
    if (email) {
      const { data } = await supabaseAdmin.from('contacts').select('*').eq('tenant_id', tenantId).ilike('email', email);
      if (data?.length === 1) matched = data[0];
    }
    if (!matched && phone) {
      const { data } = await supabaseAdmin.from('contacts').select('*').eq('tenant_id', tenantId).eq('phone', phone);
      if (data?.length === 1) matched = data[0];
    }
    if (matched) {
      await supabaseAdmin.from('contact_identities').upsert({
        tenant_id: tenantId, contact_id: matched.id, provider, provider_id: providerId
      }, { onConflict: 'tenant_id,provider,provider_id' });
      return matched;
    }

    // 3. Not found. Create a new unified contact.
    const { data: newContact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert({
        tenant_id: tenantId,
        first_name: profileData?.firstName || 'Unknown',
        last_name: profileData?.lastName || '',
        phone: profileData?.phone || (provider === 'whatsapp' ? providerId : null),
        email: profileData?.email || (provider === 'email' ? providerId : null),
      })
      .select()
      .single();

    if (contactError) throw new Error(`Failed to create CRM contact: ${contactError.message}`);

    // 4. Link the new contact to the provider identity
    const { error: linkError } = await supabaseAdmin
      .from('contact_identities')
      .insert({
        tenant_id: tenantId,
        contact_id: newContact.id,
        provider,
        provider_id: providerId
      });

    if (linkError) throw new Error(`Failed to link contact identity: ${linkError.message}`);

    return newContact;
  }
}
