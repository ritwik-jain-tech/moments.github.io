import { useEffect } from 'react';

/**
 * Custom hook to manage Open Graph and other meta tags dynamically
 */
export const useMetaTags = ({ title, description, url, image, imageWidth = '1200', imageHeight = '630' }) => {
  useEffect(() => {
    // Update or create meta tags
    const updateMetaTag = (property, content) => {
      if (!content) return;
      
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update title
    if (title) {
      document.title = title;
      updateMetaTag('og:title', title);
    }

    // Update description
    if (description) {
      updateMetaTag('og:description', description);
      // Update regular description meta tag (name instead of property)
      let descElement = document.querySelector('meta[name="description"]');
      if (!descElement) {
        descElement = document.createElement('meta');
        descElement.setAttribute('name', 'description');
        document.head.appendChild(descElement);
      }
      descElement.setAttribute('content', description);
    }

    // Update URL
    if (url) {
      updateMetaTag('og:url', url);
    }

    // Update image
    if (image) {
      updateMetaTag('og:image', image);
      if (imageWidth) {
        updateMetaTag('og:image:width', imageWidth);
      }
      if (imageHeight) {
        updateMetaTag('og:image:height', imageHeight);
      }
    }

    // Set default og:type
    updateMetaTag('og:type', 'website');

    // Cleanup function to restore default meta tags if needed
    return () => {
      // Optionally restore default values here
    };
  }, [title, description, url, image, imageWidth, imageHeight]);
};

