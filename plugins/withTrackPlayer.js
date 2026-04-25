const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withTrackPlayer(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const mainApplication = manifest.application[0];

    // Add tools namespace if it doesn't exist
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }
    
    // Add MusicService if it doesn't exist
    const serviceName = 'com.doublesymmetry.trackplayer.service.MusicService';
    if (!mainApplication.service) {
      mainApplication.service = [];
    }
    
    const hasService = mainApplication.service.some(
      (service) => service.$['android:name'] === serviceName
    );
    
    if (!hasService) {
      mainApplication.service.push({
        $: {
          'android:name': serviceName,
          'android:exported': 'true',
          'android:foregroundServiceType': 'mediaPlayback',
          'tools:replace': 'android:exported,android:foregroundServiceType',
        },
      });
    } else {
      // If service already exists, ensure it has the right attributes and tools:replace
      const service = mainApplication.service.find(s => s.$['android:name'] === serviceName);
      service.$['android:exported'] = 'true';
      service.$['android:foregroundServiceType'] = 'mediaPlayback';
      service.$['tools:replace'] = 'android:exported,android:foregroundServiceType';
    }
    
    return config;
  });
};
