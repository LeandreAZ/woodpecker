import AuthScreen, { type AuthScreenProps } from './AuthScreen';

function AuthPage(props: AuthScreenProps) {
  return <AuthScreen {...props} />;
}

export type { AuthScreenProps };
export { AuthScreen, AuthPage };
export default AuthPage;
