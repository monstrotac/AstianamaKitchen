import { useAuth } from '../../contexts/AuthContext';

export default function GuestBanner() {
  const { isGuest } = useAuth();
  if (!isGuest) return null;
  return (
    <div className="s-guest-banner">
      <div className="s-guest-banner-text">
        YOUR ACCOUNT IS PENDING APPROVAL — CONTENT CREATION IS RESTRICTED
      </div>
    </div>
  );
}
