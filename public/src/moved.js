// The app lives at https://dragonconnector.com/app/. A visit to its first address moves there and keeps
// the screen it asked for. Through the rewrite on dragonconnector.com the browser shows the new address,
// so this only runs for the old one.
if (location.hostname === 'dragonconnectorapp.vercel.app') location.replace(`https://dragonconnector.com/app/${location.hash}`);
