export const MEDIA = {
  logo: {
    onLight: '/media/logo/40labs-logo-on-light.svg',
    onDark: '/media/logo/40labs-logo-on-dark.svg',
    mark: '/media/logo/core-mark.svg',
  },
  loader: {
    instant: '/media/animation/core_instant_loader.svg',
    long: '/media/animation/core_long_loader.svg',
  },
  audio: {
    notification: '/media/audio/notification.mp3',
  },
} as const; // NO `picture` key. TODO: [reason: pictures deferred by owner] [phase: post-9]

export type MediaRegistry = typeof MEDIA;
