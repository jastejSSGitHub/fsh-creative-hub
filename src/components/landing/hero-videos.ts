export type CapabilityVideo = {
  src: string;
  label: string;
  aspect: "square" | "portrait" | "video";
};

export const HERO_CAPABILITY_VIDEOS: CapabilityVideo[] = [
  {
    src: "/media/capabilities/brand-system/video.mp4",
    label: "Brand system",
    aspect: "square",
  },
  {
    src: "/media/capabilities/film/td-video.mp4",
    label: "Film",
    aspect: "video",
  },
  {
    src: "/media/capabilities/logo/logo-video.mp4",
    label: "Logo",
    aspect: "square",
  },
  {
    src: "/media/capabilities/graphics/sutlej-video.mp4",
    label: "Graphics",
    aspect: "portrait",
  },
  {
    src: "/media/capabilities/graphics/sutlej-video2.mp4",
    label: "Graphics",
    aspect: "square",
  },
  {
    src: "/media/capabilities/presentation/presentation-video.mp4",
    label: "Presentation",
    aspect: "video",
  },
  {
    src: "/media/capabilities/website/video.mp4",
    label: "Website",
    aspect: "portrait",
  },
];
