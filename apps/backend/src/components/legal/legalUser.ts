import type { IUserDocument } from '../../types/users';
import { getCurrentLegalVersions } from './store';

export type LegalUserFields = {
  termsVersion: number;
  privacyVersion: number;
  termsAcceptedVersion: number;
  privacyAcceptedVersion: number;
  needsTermsAcceptance: boolean;
  needsPrivacyAcceptance: boolean;
  needsLegalAcceptance: boolean;
};

export async function legalFieldsForUser(user: Pick<IUserDocument, 'termsAcceptedVersion' | 'privacyAcceptedVersion'>): Promise<LegalUserFields> {
  const versions = await getCurrentLegalVersions();
  const termsAccepted = Number(user.termsAcceptedVersion) || 0;
  const privacyAccepted = Number(user.privacyAcceptedVersion) || 0;
  const needsTermsAcceptance = termsAccepted < versions.terms;
  const needsPrivacyAcceptance = privacyAccepted < versions.privacy;
  return {
    termsVersion: versions.terms,
    privacyVersion: versions.privacy,
    termsAcceptedVersion: termsAccepted,
    privacyAcceptedVersion: privacyAccepted,
    needsTermsAcceptance,
    needsPrivacyAcceptance,
    needsLegalAcceptance: needsTermsAcceptance || needsPrivacyAcceptance,
  };
}

export async function stampLegalAcceptance(user: IUserDocument): Promise<void> {
  const versions = await getCurrentLegalVersions();
  user.termsAcceptedVersion = versions.terms;
  user.privacyAcceptedVersion = versions.privacy;
  user.termsAcceptedAt = new Date();
  user.privacyAcceptedAt = new Date();
}
