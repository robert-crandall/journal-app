/**
 * Test avatar data for testing base64 image functionality
 */

// Small 1x1 pixel PNG image in base64 format - valid for testing
export const validAvatarBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGXOV6XgAAAABJRU5ErkJggg==';

// Small 1x1 pixel JPEG image in base64 format
export const validJpegAvatarBase64 =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

// Small 1x1 pixel WebP image in base64 format
export const validWebpAvatarBase64 = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

// Invalid formats for testing validation
export const invalidBase64NotDataUrl = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGXOV6XgAAAABJRU5ErkJggg==';

export const invalidMimeType = 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGXOV6XgAAAABJRU5ErkJggg==';

export const invalidBase64Data = 'data:image/png;base64,not!valid@base64#data';

// Large image that would exceed 2MB limit (simulated with repeated data)
export const oversizedAvatarBase64 = `data:image/png;base64,${'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGXOV6XgAAAABJRU5ErkJggg=='.repeat(50000)}`;
