import AuthModal from '../components/AuthModal';
import { useState } from 'react';

export default function LoginPage() {
  const [showAuth, setShowAuth] = useState(true);

  return (
    <>
      {showAuth && (
        <AuthModal
          open={showAuth}
          onClose={() => setShowAuth(false)}
          onAuthChange={(session) => {
            // Maybe redirect on success
            setShowAuth(false);
            window.location.href = '/requests';
          }}
        />
      )}
    </>
  );
}
