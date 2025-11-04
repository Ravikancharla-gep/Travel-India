# Header Images Folder

Add your rotating background images here!

## Instructions:
1. Add your India travel images to this folder
2. Name them as: `travel-india-1.jpg`, `travel-india-2.jpg`, `travel-india-3.jpg`, etc.
3. Supported formats: `.jpg`, `.jpeg`, `.png`
4. Recommended size: 1920x600px or similar aspect ratio
5. Images will automatically rotate every 7 seconds

## Manual Navigation:
- **Left Arrow Button**: Navigate to previous image
- **Right Arrow Button**: Navigate to next image
- **Image Counter**: Shows current image number (e.g., "3 / 10")
- Auto-rotation pauses for 15 seconds after manual navigation

## Current Setup:
- The default image is `/Assets/Travel-India.png` (outside this folder)
- Supports up to 10 additional images (travel-india-1.jpg through travel-india-10.jpg)
- You can add more by editing the code in `src/components/Sidebar.tsx` in the `getBgImages()` function
- If no images are added here, only the default image will be shown

## Notes:
- Make sure images are optimized for web (not too large)
- Images should showcase beautiful places in India
- The header will automatically cycle through all available images
- Navigation buttons only appear when there are 2+ images

