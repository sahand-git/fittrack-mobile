// A Google identity is accepted only after Firebase verifies its credential.
export async function completeGoogleLogin<T>(native: boolean, actions: {
  chooseNativeAccount: () => Promise<{credential?: {idToken?: string | null}}>;
  verifyIdToken: (token: string) => Promise<T>;
  openWebSignIn: () => Promise<T>;
}): Promise<T> {
  if (!native) return actions.openWebSignIn();
  const result = await actions.chooseNativeAccount();
  const token = result.credential?.idToken;
  if (!token) throw Object.assign(new Error('Google did not return an identity token.'), {code:'auth/missing-google-token'});
  return actions.verifyIdToken(token);
}
