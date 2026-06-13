import React from 'react';
import AdminRedirect from './AdminRedirect';
import B2BLanding from '../pages/B2BLanding';

// studio.moments.live serves the same build as moments.live, but its root
// should land on the admin tool (login/dashboard) rather than the B2B page.
const HomeRouter = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'studio.moments.live') {
    return <AdminRedirect />;
  }
  return <B2BLanding />;
};

export default HomeRouter;
