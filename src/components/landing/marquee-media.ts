export type MarqueeMediaItem = {
  label: string;
  src: string;
  type: "image" | "video";
};

export const MARQUEE_MEDIA: MarqueeMediaItem[] = [
  {
    label: "Campaign",
    src: "/media/capabilities/presentation/presentation1.png",
    type: "image",
  },
  {
    label: "Social",
    src: "/media/capabilities/graphics/sutlej-video.mp4",
    type: "video",
  },
  {
    label: "Video",
    src: "/media/capabilities/film/td-video.mp4",
    type: "video",
  },
  {
    label: "Brand",
    src: "/media/capabilities/brand-system/brand-1.png",
    type: "image",
  },
  {
    label: "Print",
    src: "/media/capabilities/graphics/sutlej.png",
    type: "image",
  },
  {
    label: "Web",
    src: "/media/capabilities/website/coffee-website.png",
    type: "image",
  },
];
